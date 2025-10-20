import { ScriptExecutionService, ScriptAction, ScriptExecutionOptions } from './script-execution.service';
export declare class ScriptController {
    private readonly scriptExecutionService;
    constructor(scriptExecutionService: ScriptExecutionService);
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
}
