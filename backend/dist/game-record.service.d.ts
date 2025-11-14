import { Model } from 'mongoose';
import { GameRecord } from './game-record.schema';
import { SignatureHeaderService } from './signature-header.service';
import { Account } from './account.schema';
import { EncryptionService } from './encryption.service';
export interface CreateGameRecordInput {
    accountId: string;
    gameLabel: string;
    apiResponse: Record<string, unknown>;
}
export interface CreateGameRecordWithTokenInput {
    privitoken: string;
    gameLabel: string;
    wallet: string;
}
export declare class GameRecordService {
    private readonly model;
    private readonly accountModel;
    private readonly signatureHeaderService;
    private readonly encryptionService;
    constructor(model: Model<GameRecord>, accountModel: Model<Account>, signatureHeaderService: SignatureHeaderService, encryptionService: EncryptionService);
    createUnused(input: CreateGameRecordInput): Promise<GameRecord>;
    createUnusedBulk(inputs: CreateGameRecordInput[]): Promise<GameRecord[]>;
    findByWalletAddress(walletAddress: string): Promise<Record<string, unknown>[]>;
    updateStatusToUsed(recordId: string): Promise<GameRecord | null>;
    createWithProvidedToken(input: CreateGameRecordWithTokenInput): Promise<GameRecord[]>;
    private extractFields;
}
