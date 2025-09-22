import { Model, Types } from 'mongoose';
import { Log, LogStatus } from './log.schema';
import { ActionType } from './scenario.schema';
export interface CreateLogInput {
    accountId: Types.ObjectId;
    scenarioId: Types.ObjectId;
    actionType: ActionType;
    status: LogStatus;
    error?: string;
    result?: Record<string, unknown>;
}
export declare class LoggingService {
    private readonly logModel;
    constructor(logModel: Model<Log>);
    createLog(data: CreateLogInput): Promise<Log>;
    getLogsByAccount(accountId: Types.ObjectId): Promise<Log[]>;
    getLogsByScenario(scenarioId: Types.ObjectId): Promise<Log[]>;
    getLogsByAccountPaginated(accountId: Types.ObjectId, page: number, limit: number): Promise<{
        items: Log[];
        total: number;
    }>;
    getLogsByScenarioPaginated(scenarioId: Types.ObjectId, page: number, limit: number): Promise<{
        items: Log[];
        total: number;
    }>;
    getLogsPaginated(filters: {
        accountId?: Types.ObjectId;
        scenarioId?: Types.ObjectId;
        actionType?: ActionType;
        status?: LogStatus;
    }, page: number, limit: number): Promise<{
        items: Log[];
        total: number;
    }>;
}
