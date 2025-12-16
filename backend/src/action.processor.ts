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
import { ethers } from 'ethers';

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
        case ActionType.CREATE_WALLET:
        case 'CreateWallet': {
          const secretPhrase = action.config['secretPhrase'] as string;
          if (!secretPhrase) {
            throw new Error('Missing secretPhrase for CREATE_WALLET action');
          }
          
          // Create wallet from mnemonic phrase
          const wallet = ethers.Wallet.fromPhrase(secretPhrase);
          const walletAddress = wallet.address;
          const privateKey = wallet.privateKey;
          
          // Update the account with the new wallet information using account service
          const updatedAccount = await this.accountService.updateWalletAddress(accountId, walletAddress);
          
          result = {
            success: true,
            walletAddress,
            privateKey,
            message: 'Wallet created and saved successfully',
          };
          break;
        }
        case ActionType.CREATE_RECORD_GAME:
        case 'CreateRecordGame': {
          const gameLabel = action.config['gameLabel'] as string;
          if (!gameLabel) {
            throw new Error('Missing gameLabel for CREATE_RECORD_GAME action');
          }
          
          // Check if account is ready for CREATE_RECORD_GAME
          const readiness = await this.accountService.checkCreateRecordGameReadiness(accountId, gameLabel);
          if (!readiness.ready) {
            throw new Error(`Account not ready for CREATE_RECORD_GAME: ${readiness.issues.join(', ')}`);
          }
          
          // Get wallet from account service (ensures updated value)
          const account = await this.accountService.findOne(accountId);
          const wallet = account.walletAddress;
          
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
            'https://maze-api.uptopia.xyz/api/v1/bot/signature',
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
          // Handle response data - could be array or single object
          const responseData = response.data as any;
          console.log('CREATE_RECORD_GAME API Response:', JSON.stringify(responseData, null, 2));
          
          // Extract records from the API response structure
          let records: any[] = [];
          if (responseData?.data && Array.isArray(responseData.data)) {
            // API returns { status: true, data: [...] }
            records = responseData.data;
            console.log(`Found ${records.length} records in responseData.data`);
          } else if (Array.isArray(responseData)) {
            // API returns array directly
            records = responseData;
            console.log(`Found ${records.length} records in direct array response`);
          } else {
            // Single record response
            records = [responseData];
            console.log('Single record response, wrapping in array');
          }
          
          if (records.length === 0) {
            throw new Error('No records found in API response');
          }
          
          // Log statistics about the records
          const recordIds = records.map(r => r.recordId).filter(Boolean);
          const uniqueRecordIds = new Set(recordIds);
          
      console.log(`Record statistics:`, {
        totalRecords: records.length,
        recordsWithId: recordIds.length,
        uniqueRecordIds: uniqueRecordIds.size,
        duplicateRecordIds: recordIds.length - uniqueRecordIds.size
      });

      console.log(`API returned ${records.length} unique records (no duplicates in API response)`);
          
          // Save each record individually
          const gameRecordInputs = records.map(record => ({
            accountId,
            gameLabel,
            apiResponse: record as Record<string, unknown>,
          }));
          
          // Save logs for each record
          for (const record of records) {
            await this.loggingService.createLog({
              accountId: new Types.ObjectId(accountId),
              scenarioId: new Types.ObjectId(scenarioId),
              actionType: action.type,
              status: LogStatus.UNUSED,
              result: record as Record<string, unknown>,
            });
          }
          
          // Persist all game records in bulk
          try {
            const savedRecords = await this.gameRecordService.createUnusedBulk(gameRecordInputs);
            console.log(`Successfully saved ${savedRecords.length} game records`);
          } catch (dbError) {
            console.error('Bulk save failed, trying individual saves:', dbError);
            // Fallback: try to save each record individually
            let successCount = 0;
            for (const input of gameRecordInputs) {
              try {
                await this.gameRecordService.createUnused(input);
                successCount++;
                console.log(`Individual record saved successfully (${successCount}/${gameRecordInputs.length})`);
              } catch (individualError) {
                console.error('Failed to save individual record:', individualError);
              }
            }
            console.log(`Individual save completed: ${successCount} records saved`);
          }
          
          result = records;
          // Return the list of records
          return { ...(previousResults || {}), [action.type]: records };
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
        case ActionType.CREATE_CAST:
        case 'CreateCast': {
          const text = action.config['text'] as string;
          const mediaUrls = action.config['mediaUrls'] as string[] | undefined;
          
          if (!text) {
            throw new Error('Missing text for CREATE_CAST action');
          }
          
          // Create cast with optional media embeds
          result = await this.farcasterService.createCast(encryptedToken, text, mediaUrls);
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



