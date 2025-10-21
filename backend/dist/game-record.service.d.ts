import { Model } from 'mongoose';
import { GameRecord } from './game-record.schema';
export interface CreateGameRecordInput {
    accountId: string;
    gameLabel: string;
    apiResponse: Record<string, unknown>;
}
export declare class GameRecordService {
    private readonly model;
    constructor(model: Model<GameRecord>);
    createUnused(input: CreateGameRecordInput): Promise<GameRecord>;
    createUnusedBulk(inputs: CreateGameRecordInput[]): Promise<GameRecord[]>;
    recordExists(accountId: string, gameLabel: string, apiResponse: Record<string, unknown>): Promise<boolean>;
    findByWalletAddress(walletAddress: string): Promise<Record<string, unknown>[]>;
    updateStatusToUsed(recordId: string): Promise<GameRecord | null>;
    private extractFields;
}
