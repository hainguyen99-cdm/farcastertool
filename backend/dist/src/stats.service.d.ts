import { Model } from 'mongoose';
import { Account } from './account.schema';
import { Scenario } from './scenario.schema';
import { Log } from './log.schema';
export interface DashboardStats {
    totalAccounts: number;
    activeAccounts: number;
    totalScenarios: number;
    totalExecutions: number;
    successRate: number;
    recentLogs: Array<{
        _id: string;
        accountId: string;
        scenarioId: string;
        timestamp: Date;
        accountName: string;
        scenarioName: string;
        actionType: string;
        status: string;
    }>;
    actionDistribution: Array<{
        actionType: string;
        count: number;
    }>;
    executionTrends: Array<{
        date: string;
        executions: number;
        successes: number;
    }>;
}
export declare class StatsService {
    private accountModel;
    private scenarioModel;
    private logModel;
    constructor(accountModel: Model<Account>, scenarioModel: Model<Scenario>, logModel: Model<Log>);
    getDashboardStats(): Promise<DashboardStats>;
}
