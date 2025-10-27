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

export interface ScriptExecutionOptions {
  loop?: number;
  shuffle?: boolean;
}

export interface ExecuteScriptResult {
  accountId: string;
  actionsExecuted: number;
  loopsExecuted: number;
  results: Array<{
    actionType: ActionType;
    success: boolean;
    result?: unknown;
    error?: string;
    loopIndex?: number;
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
    actions: ScriptAction[],
    options: ScriptExecutionOptions = {}
  ): Promise<ExecuteScriptResult> {
    const account = await this.accountModel.findById(new Types.ObjectId(accountId)).exec();
    if (!account) {
      throw new Error('Account not found');
    }

    const { loop = 1, shuffle = false } = options;
    const results: Array<{
      actionType: ActionType;
      success: boolean;
      result?: unknown;
      error?: string;
      loopIndex?: number;
    }> = [];

    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (let loopIndex = 0; loopIndex < loop; loopIndex++) {
      // Shuffle actions if requested
      const actionsToExecute = shuffle 
        ? [...sortedActions].sort(() => Math.random() - 0.5)
        : sortedActions;

      for (const action of actionsToExecute) {
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
            loopIndex,
          });
        } catch (error) {
          results.push({
            actionType: action.type,
            success: false,
            error: (error as Error).message,
            loopIndex,
          });
        }
      }
    }

    return {
      accountId: account._id.toString(),
      actionsExecuted: results.length,
      loopsExecuted: loop,
      results,
    };
  }

  async executeScriptOnMultipleAccounts(
    accountIds: string[],
    actions: ScriptAction[],
    options: ScriptExecutionOptions = {}
  ): Promise<{ status: string; message: string; accounts: string[] }> {
    // Process accounts in the background to avoid gateway timeout
    this.processMultipleAccountsInBackground(accountIds, actions, options).catch(err => {
      console.error('Error processing multiple accounts:', err);
    });

    return {
      status: 'started',
      message: `Started processing ${accountIds.length} accounts in background`,
      accounts: accountIds,
    };
  }

  private async processMultipleAccountsInBackground(
    accountIds: string[],
    actions: ScriptAction[],
    options: ScriptExecutionOptions
  ): Promise<void> {
    const results: ExecuteScriptResult[] = [];
    const startTime = Date.now();
    console.log(`[ScriptExecution] Starting background processing for ${accountIds.length} accounts`);
    
    for (let i = 0; i < accountIds.length; i++) {
      const accountId = accountIds[i];
      try {
        console.log(`[ScriptExecution] Processing account ${i + 1}/${accountIds.length}: ${accountId}`);
        const result = await this.executeScript(accountId, actions, options);
        results.push(result);
      } catch (error) {
        console.error(`[ScriptExecution] Error processing account ${accountId}:`, error);
        results.push({
          accountId,
          actionsExecuted: 0,
          loopsExecuted: 0,
          results: [{
            actionType: actions[0]?.type || ActionType.GET_FEED,
            success: false,
            error: (error as Error).message,
          }],
        });
      }
    }

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.actionsExecuted > 0).length;
    const failed = results.length - successful;
    
    console.log(`[ScriptExecution] Completed processing ${results.length} accounts in ${duration}ms`);
    console.log(`[ScriptExecution] Successful: ${successful}, Failed: ${failed}`);
  }
}

