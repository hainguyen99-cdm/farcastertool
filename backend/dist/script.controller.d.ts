import { ScriptExecutionService, ScriptAction } from './script-execution.service';
export declare class ScriptController {
    private readonly scriptExecutionService;
    constructor(scriptExecutionService: ScriptExecutionService);
    executeScript(body: {
        accountId: string;
        actions: ScriptAction[];
    }): Promise<import("./script-execution.service").ExecuteScriptResult>;
    executeScriptOnMultipleAccounts(body: {
        accountIds: string[];
        actions: ScriptAction[];
    }): Promise<import("./script-execution.service").ExecuteScriptResult[]>;
}
