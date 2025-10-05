import { GameRecordService } from './game-record.service';
import { GameRecord } from './game-record.schema';
export declare class GameRecordController {
    private readonly gameRecordService;
    constructor(gameRecordService: GameRecordService);
    getGameRecordsByWallet(walletAddress: string): Promise<Record<string, unknown>[]>;
    updateStatusToUsed(recordId: string): Promise<GameRecord | null>;
}
