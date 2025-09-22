import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account } from './account.schema';
import { ActionType } from './scenario.schema';

export interface ScriptAction {
  type: ActionType;
  config: Record<string, unknown>;
  order: number;
}

export interface ExecuteScriptResult {
  accountId: string;
  actionsExecuted: number;
  results: Array<{
    actionType: ActionType;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
}

@Injectable()
export class ScriptExecutionService {
  constructor(
    @InjectQueue('actions') private readonly actionsQueue: Queue,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
  ) {}

  async executeScript(
    accountId: string, 
    actions: ScriptAction[]
  ): Promise<ExecuteScriptResult> {
    const account = await this.accountModel.findById(new Types.ObjectId(accountId)).exec();
    if (!account) {
      throw new Error('Account not found');
    }

    const results: Array<{
      actionType: ActionType;
      success: boolean;
      result?: unknown;
      error?: string;
    }> = [];

    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        const job = await this.actionsQueue.add({
          accountId: account._id.toString(),
          scenarioId: new Types.ObjectId().toString(), // Generate a new ObjectId for script execution
          action: {
            type: action.type,
            config: action.config,
          },
          encryptedToken: account.encryptedToken,
          previousResults: {},
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: true,
        });

        const result = (await job.finished()) as Record<string, unknown>;
        results.push({
          actionType: action.type,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          actionType: action.type,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return {
      accountId: account._id.toString(),
      actionsExecuted: results.length,
      results,
    };
  }

  async executeScriptOnMultipleAccounts(
    accountIds: string[],
    actions: ScriptAction[]
  ): Promise<ExecuteScriptResult[]> {
    const results: ExecuteScriptResult[] = [];
    
    for (const accountId of accountIds) {
      try {
        const result = await this.executeScript(accountId, actions);
        results.push(result);
      } catch (error) {
        results.push({
          accountId,
          actionsExecuted: 0,
          results: [{
            actionType: actions[0]?.type || ActionType.GET_FEED,
            success: false,
            error: (error as Error).message,
          }],
        });
      }
    }

    return results;
  }
}

