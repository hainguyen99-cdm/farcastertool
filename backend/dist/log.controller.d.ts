import { LoggingService } from './logging.service';
import { LogStatus } from './log.schema';
import { ActionType } from './scenario.schema';
export declare class LogController {
    private readonly loggingService;
    constructor(loggingService: LoggingService);
    getByAccount(accountId: string, page?: string, limit?: string): Promise<{
        items: import("./log.schema").Log[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
    getByScenario(scenarioId: string, page?: string, limit?: string): Promise<{
        items: import("./log.schema").Log[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
    getLogs(accountId?: string, scenarioId?: string, actionType?: ActionType, status?: LogStatus, page?: string, limit?: string): Promise<{
        items: import("./log.schema").Log[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
}
