import { Queue } from 'bull';
import { Model } from 'mongoose';
import { Scenario } from './scenario.schema';
import { Account } from './account.schema';
interface ExecuteScenarioResult {
    accountId: string;
    loopsRun: number;
}
export declare class ScenarioExecutionService {
    private readonly actionsQueue;
    private readonly scenarioModel;
    private readonly accountModel;
    constructor(actionsQueue: Queue, scenarioModel: Model<Scenario>, accountModel: Model<Account>);
    executeScenario(scenarioId: string, accountIds: string[]): Promise<ExecuteScenarioResult[]>;
    private shuffleArray;
}
export {};
