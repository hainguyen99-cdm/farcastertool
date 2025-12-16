import { Job } from 'bull';
import { FarcasterService } from './farcaster.service';
import { LoggingService } from './logging.service';
import { ActionType } from './scenario.schema';
import { AccountService } from './account.service';
import { SignatureHeaderService } from './signature-header.service';
import { GameRecordService } from './game-record.service';
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
    private readonly accountService;
    private readonly signatureHeaderService;
    private readonly gameRecordService;
    constructor(farcasterService: FarcasterService, loggingService: LoggingService, accountService: AccountService, signatureHeaderService: SignatureHeaderService, gameRecordService: GameRecordService);
    processAction(job: Job<ActionJobData>): Promise<Record<string, unknown>>;
    private sleep;
}
export {};
