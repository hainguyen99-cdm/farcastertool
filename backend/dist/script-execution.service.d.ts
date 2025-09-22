import { Queue } from 'bull';
import { Model } from 'mongoose';
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
export declare class ScriptExecutionService {
    private readonly actionsQueue;
    private readonly accountModel;
    constructor(actionsQueue: Queue, accountModel: Model<Account>);
    executeScript(accountId: string, actions: ScriptAction[]): Promise<ExecuteScriptResult>;
    executeScriptOnMultipleAccounts(accountIds: string[], actions: ScriptAction[]): Promise<ExecuteScriptResult[]>;
}
