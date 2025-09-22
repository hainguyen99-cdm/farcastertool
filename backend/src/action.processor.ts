import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { Types } from 'mongoose';
import { FarcasterService } from './farcaster.service';
import { LoggingService } from './logging.service';
import { ActionType } from './scenario.schema';
import { LogStatus } from './log.schema';

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
  ) {}

  @Process()
  async processAction(job: Job<ActionJobData>): Promise<Record<string, unknown>> {
    const { accountId, scenarioId, action, encryptedToken, previousResults } = job.data;
    try {
      let result: unknown;
      switch (action.type) {
        case ActionType.GET_FEED: {
          result = await this.farcasterService.getFeed(encryptedToken);
          break;
        }
        case ActionType.LIKE_CAST: {
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
        case ActionType.RECAST_CAST: {
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
        case ActionType.DELAY: {
          const delayMs: number = typeof action.config['delayMs'] === 'number' ? (action.config['delayMs'] as number) : 5000;
          await this.sleep(delayMs);
          result = { success: true, delayMs };
          break;
        }
        case ActionType.JOIN_CHANNEL: {
          const channelKey = action.config['channelKey'] as string;
          const inviteCode = action.config['inviteCode'] as string;
          if (!channelKey || !inviteCode) {
            throw new Error('Missing channelKey or inviteCode for JOIN_CHANNEL action');
          }
          result = await this.farcasterService.joinChannel(encryptedToken, channelKey, inviteCode);
          break;
        }
        case ActionType.PIN_MINI_APP: {
          const domain = action.config['domain'] as string;
          if (!domain) {
            throw new Error('Missing domain for PIN_MINI_APP action');
          }
          result = await this.farcasterService.pinMiniApp(encryptedToken, domain);
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



