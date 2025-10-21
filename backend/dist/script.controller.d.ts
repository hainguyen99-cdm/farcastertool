import { ScriptExecutionService, ScriptAction, ScriptExecutionOptions } from './script-execution.service';
import { AccountService } from './account.service';
export declare class ScriptController {
    private readonly scriptExecutionService;
    private readonly accountService;
    constructor(scriptExecutionService: ScriptExecutionService, accountService: AccountService);
    executeScript(body: {
        accountId: string;
        actions: ScriptAction[];
        options?: ScriptExecutionOptions;
    }): Promise<import("./script-execution.service").ExecuteScriptResult>;
    executeScriptOnMultipleAccounts(body: {
        accountIds: string[];
        actions: ScriptAction[];
        options?: ScriptExecutionOptions;
    }): Promise<import("./script-execution.service").ExecuteScriptResult[]>;
    debugAccountReadiness(accountId: string, gameLabel: string): Promise<{
        accountId: string;
        gameLabel: string;
        readiness: {
            ready: boolean;
            issues: string[];
        };
        account: {
            id: any;
            name: string;
            walletAddress: string;
            privyTokens: {
                gameLabel: string;
                hasToken: boolean;
            }[];
        };
    }>;
}
