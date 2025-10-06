import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { Types } from 'mongoose';
import { FarcasterService } from './farcaster.service';
import { LoggingService } from './logging.service';
import { ActionType } from './scenario.schema';
import { LogStatus } from './log.schema';
import { AccountService } from './account.service';
import { SignatureHeaderService } from './signature-header.service';
import { GameRecordService } from './game-record.service';

interface ActionJobDataAction {
  type: ActionType;
  config: Record<string, unknown>;
}

interface ActionJobData {
  accountId: string;
  scenarioId: string;
  action: ActionJobDataAction;
  encryptedToken: string;
  previousResults?: Record<string, unknown>;
}

@Injectable()
@Processor('actions')
export class ActionProcessor {
  constructor(
    private readonly farcasterService: FarcasterService,
    private readonly loggingService: LoggingService,
    private readonly accountService: AccountService,
    private readonly signatureHeaderService: SignatureHeaderService,
    private readonly gameRecordService: GameRecordService,
  ) {}

  @Process()
  async processAction(job: Job<ActionJobData>): Promise<Record<string, unknown>> {
    const { accountId, scenarioId, action, encryptedToken, previousResults } = job.data;
    try {
      let result: unknown;
      switch (action.type) {
        case ActionType.GET_FEED:
        case 'GetFeed': {
          result = await this.farcasterService.getFeed(encryptedToken);
          break;
        }
        case ActionType.LIKE_CAST:
        case 'LikeCast': {
          const likeMethod = action.config['likeMethod'] as string;
          let castHash: string | null = null;

          if (likeMethod === 'url') {
            // Get first cast hash from thread using the user-thread-casts API
            const castUrl = action.config['castUrl'] as string;
            if (!castUrl) {
              throw new Error('Missing castUrl for LIKE_CAST action with URL method');
            }
            castHash = await this.farcasterService.getFirstCastHashFromThread(encryptedToken, castUrl);
            if (!castHash) {
              throw new Error(`No casts found in thread for URL: ${castUrl}`);
            }
          } else {
            // Default to random method - get from feed
            const prior = (previousResults as Record<string, unknown> | undefined) || {};
            const castHashFromFeed = this.farcasterService.getRandomCastHashFromFeed(prior[ActionType.GET_FEED]);
            castHash = (castHashFromFeed as string | null) || (action.config['castHash'] as string);
            if (!castHash) {
              throw new Error('Missing castHash for LIKE_CAST action - no feed data available and no fallback provided');
            }
          }

          result = await this.farcasterService.likeCast(encryptedToken, castHash);
          break;
        }
        case ActionType.RECAST_CAST:
        case 'RecastCast': {
          const recastMethod = action.config['likeMethod'] as string;
          let castHash: string | null = null;

          if (recastMethod === 'url') {
            const castUrl = action.config['castUrl'] as string;
            if (!castUrl) {
              throw new Error('Missing castUrl for RECAST_CAST action with URL method');
            }
            castHash = await this.farcasterService.getFirstCastHashFromThread(encryptedToken, castUrl);
            if (!castHash) {
              throw new Error(`No casts found in thread for URL: ${castUrl}`);
            }
          } else {
            const prior = (previousResults as Record<string, unknown> | undefined) || {};
            const castHashFromFeed = this.farcasterService.getRandomCastHashFromFeed(prior[ActionType.GET_FEED]);
            castHash = (castHashFromFeed as string | null) || (action.config['castHash'] as string);
            if (!castHash) {
              throw new Error('Missing castHash for RECAST_CAST action - no feed data available and no fallback provided');
            }
          }

          result = await this.farcasterService.recastCast(encryptedToken, castHash);
          break;
        }
        case ActionType.DELAY:
        case 'Delay': {
          const delayMs: number = typeof action.config['delayMs'] === 'number' ? (action.config['delayMs'] as number) : 5000;
          await this.sleep(delayMs);
          result = { success: true, delayMs };
          break;
        }
        case ActionType.JOIN_CHANNEL:
        case 'JoinChannel': {
          const channelKey = action.config['channelKey'] as string;
          const inviteCode = action.config['inviteCode'] as string;
          if (!channelKey || !inviteCode) {
            throw new Error('Missing channelKey or inviteCode for JOIN_CHANNEL action');
          }
          result = await this.farcasterService.joinChannel(encryptedToken, channelKey, inviteCode);
          break;
        }
        case ActionType.PIN_MINI_APP:
        case 'PinMiniApp': {
          const domain = action.config['domain'] as string;
          if (!domain) {
            throw new Error('Missing domain for PIN_MINI_APP action');
          }
          result = await this.farcasterService.pinMiniApp(encryptedToken, domain);
          break;
        }
        case ActionType.FOLLOW_USER:
        case 'FollowUser': {
          const userLink = action.config['userLink'] as string;
          if (!userLink) {
            throw new Error('Missing userLink for FOLLOW_USER action');
          }
          
          // Extract username from Farcaster URL (e.g., https://farcaster.xyz/pauline-unik)
          const urlMatch = userLink.match(/farcaster\.xyz\/([^\/\?]+)/);
          if (!urlMatch) {
            throw new Error('Invalid Farcaster user URL format');
          }
          const username = urlMatch[1];
          
          // Get user info to extract FID
          const userInfo = await this.farcasterService.getUserByUsername(encryptedToken, username);
          const userData = userInfo as { result?: { user?: { fid?: number } } };
          const targetFid = userData?.result?.user?.fid;
          
          if (!targetFid) {
            throw new Error(`Could not find user FID for username: ${username}`);
          }
          
          result = await this.farcasterService.followUser(encryptedToken, targetFid);
          break;
        }
        case ActionType.UPDATE_WALLET:
        case 'UpdateWallet': {
          const updatedAccount = await this.accountService.updateWalletAndUsername(accountId);
          result = {
            success: true,
            walletAddress: updatedAccount.walletAddress,
            username: updatedAccount.username,
            fid: updatedAccount.fid,
          };
          break;
        }
        case ActionType.CREATE_RECORD_GAME:
        case 'CreateRecordGame': {
          const gameLabel = action.config['gameLabel'] as string;
          if (!gameLabel) {
            throw new Error('Missing gameLabel for CREATE_RECORD_GAME action');
          }
          // Get wallet from account service (ensures updated value)
          const account = await this.accountService.findOne(accountId);
          const wallet = account.walletAddress;
          if (!wallet) {
            throw new Error('Account has no walletAddress');
          }
          // Get privy token by label (decrypted)
          const privyToken = await this.accountService.getDecryptedPrivyToken(accountId, gameLabel);
          // Build payload and headers
          const payload = JSON.stringify({ wallet });
          // Signature header via SignatureHeaderService - injected via module
          const apiKey = process.env.RPC_VERSION_API_KEY || '';
          const secret = process.env.RPC_VERSION_SECRET || process.env.RPC_VERSION_SECRET_KEY || '';
          if (!apiKey || !secret) {
            throw new Error('Missing RPC_VERSION_API_KEY or RPC_VERSION_SECRET in env');
          }
          const signature = this.signatureHeaderService.generateSignature(apiKey, secret, payload);
          if (!signature) {
            throw new Error('Failed to generate signature');
          }
          // Perform HTTP call via FarcasterService httpService (reuse axios instance)
          const axios = await import('axios');
          const response = await axios.default.post(
            'https://maze-runner-lab-api.gfun.top/api/v1/bot/signature',
            { wallet },
            {
              headers: {
                'accept': '*/*',
                'x-api-key': apiKey,
                'signature': signature,
                'Authorization': `Bearer ${privyToken}`,
                'Content-Type': 'application/json',
              },
              timeout: 20000,
            },
          );
          // Save log as UNUSED status
          await this.loggingService.createLog({
            accountId: new Types.ObjectId(accountId),
            scenarioId: new Types.ObjectId(scenarioId),
            actionType: action.type,
            status: LogStatus.UNUSED,
            result: response.data as Record<string, unknown>,
          });
          // Persist as unused game record
          await this.gameRecordService.createUnused({
            accountId,
            gameLabel,
            apiResponse: response.data as Record<string, unknown>,
          });
          result = response.data as unknown;
          // Return early since we already logged UNUSED and saved record
          return { ...(previousResults || {}), [action.type]: { CreateRecordGame: response.data } };
        }
        case ActionType.MINI_APP_EVENT:
        case 'MiniAppEvent': {
          const domain = action.config['domain'] as string;
          const event = action.config['event'] as string;
          const platformType = action.config['platformType'] as string;
          
          if (!domain || !event) {
            throw new Error('Missing domain or event for MINI_APP_EVENT action');
          }
          
          result = await this.farcasterService.sendMiniAppEvent(
            encryptedToken, 
            domain, 
            event, 
            platformType || 'web'
          );
          break;
        }
        case ActionType.ANALYTICS_EVENTS:
        case 'AnalyticsEvents': {
          const frameDomain = action.config['frameDomain'] as string;
          const frameName = action.config['frameName'] as string;
          const frameUrl = action.config['frameUrl'] as string;
          
          if (!frameDomain || !frameName || !frameUrl) {
            throw new Error('Missing frameDomain, frameName, or frameUrl for ANALYTICS_EVENTS action');
          }
          
          // Get account FID from the account service
          const account = await this.accountService.findOne(accountId);
          if (!account.fid) {
            throw new Error('Account FID not found. Please run UpdateWallet action first to get account FID.');
          }
          
          // Create the analytics event with current timestamp
          const events = [{
            type: 'frame-launch',
            data: {
              frameDomain,
              frameUrl,
              frameName,
              authorFid: account.fid
            },
            ts: Date.now()
          }];
          
          result = await this.farcasterService.sendAnalyticsEvents(encryptedToken, events);
          break;
        }
        default: {
          const neverType: never = action.type as never;
          throw new Error(`Unknown action type: ${String(neverType)}`);
        }
      }

      await this.loggingService.createLog({
        accountId: new Types.ObjectId(accountId),
        scenarioId: new Types.ObjectId(scenarioId),
        actionType: action.type,
        status: LogStatus.SUCCESS,
        result: (result as Record<string, unknown>) || {},
      });

      return { ...(previousResults || {}), [action.type]: result };
    } catch (err) {
      await this.loggingService.createLog({
        accountId: new Types.ObjectId(accountId),
        scenarioId: new Types.ObjectId(scenarioId),
        actionType: action.type,
        status: LogStatus.FAILURE,
        error: (err as Error).message,
      });
      throw err;
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}



