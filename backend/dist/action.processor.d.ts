import { Job } from 'bull';
import { FarcasterService } from './farcaster.service';
import { LoggingService } from './logging.service';
import { ActionType } from './scenario.schema';
interface ActionJobDataAction {
    type: ActionType;
    config: Record<string, unknown>;
}
interface ActionJobData {
    accountId: string;
    scenarioId: string;
    action: ActionJobDataAction;
    encryptedToken: string;
    previousResults?: Record<string, unknown>;
}
export declare class ActionProcessor {
    private readonly farcasterService;
    private readonly loggingService;
    constructor(farcasterService: FarcasterService, loggingService: LoggingService);
    processAction(job: Job<ActionJobData>): Promise<Record<string, unknown>>;
    private sleep;
}
export {};
