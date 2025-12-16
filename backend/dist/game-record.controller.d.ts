import { GameRecordService } from './game-record.service';
import { GameRecord } from './game-record.schema';
export interface CreateGameRecordWithTokenDto {
    privitoken: string;
    gameLabel: string;
    wallet: string;
}
export declare class GameRecordController {
    private readonly gameRecordService;
    constructor(gameRecordService: GameRecordService);
    getGameRecordsByWallet(walletAddress: string): Promise<Record<string, unknown>[]>;
    updateStatusToUsed(recordId: string): Promise<GameRecord | null>;
    createWithToken(createDto: CreateGameRecordWithTokenDto): Promise<GameRecord[]>;
}
