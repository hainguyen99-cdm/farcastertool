import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameRecord, GameRecordStatus } from './game-record.schema';

export interface CreateGameRecordInput {
  accountId: string;
  gameLabel: string;
  apiResponse: Record<string, unknown>;
}

@Injectable()
export class GameRecordService {
  constructor(@InjectModel(GameRecord.name) private readonly model: Model<GameRecord>) {}

  async createUnused(input: CreateGameRecordInput): Promise<GameRecord> {
    const pieces = this.extractFields(input.apiResponse);
    const filter: Record<string, unknown> = {
      accountId: new Types.ObjectId(input.accountId),
      ...(pieces.recordId ? { recordId: pieces.recordId } : {}),
      ...(!pieces.recordId && pieces.nonce != null ? { gameLabel: input.gameLabel, nonce: pieces.nonce } : {}),
    };
    const update: Record<string, unknown> = {
      accountId: new Types.ObjectId(input.accountId),
      gameLabel: input.gameLabel,
      status: GameRecordStatus.UNUSED,
      apiResponse: input.apiResponse,
      ...pieces,
    };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true } as const;
    return this.model.findOneAndUpdate(filter, update, options).exec();
  }

  /**
   * Create multiple unused game records in bulk
   * @param inputs - Array of CreateGameRecordInput
   * @returns Promise<GameRecord[]> - Array of created/updated game records
   */
  async createUnusedBulk(inputs: CreateGameRecordInput[]): Promise<GameRecord[]> {
    if (inputs.length === 0) {
      return [];
    }

    try {
      console.log(`Processing ${inputs.length} records from API response`);

      const operations = inputs.map(input => {
        const pieces = this.extractFields(input.apiResponse);
        const filter: Record<string, unknown> = {
          accountId: new Types.ObjectId(input.accountId),
          ...(pieces.recordId ? { recordId: pieces.recordId } : {}),
        };
        const update: Record<string, unknown> = {
          accountId: new Types.ObjectId(input.accountId),
          gameLabel: input.gameLabel,
          status: GameRecordStatus.UNUSED,
          apiResponse: input.apiResponse,
          ...pieces,
        };
        return {
          updateOne: {
            filter,
            update,
            upsert: true,
          },
        };
      });

      await this.model.bulkWrite(operations);
      
      // Return saved/updated documents by refetching with accountId + gameLabel
      const accountId = inputs[0]?.accountId;
      const gameLabel = inputs[0]?.gameLabel;
      if (accountId && gameLabel) {
        return this.model.find({ 
          accountId: new Types.ObjectId(accountId), 
          gameLabel,
          status: GameRecordStatus.UNUSED 
        }).sort({ createdAt: -1 }).limit(inputs.length).exec();
      }
      
      return [];
    } catch (error) {
      console.error('Error in createUnusedBulk:', error);
      throw error;
    }
  }

  // No duplicate checking - all records are saved

  /**
   * Find all unused game records by wallet address and return only the data portion
   * @param walletAddress - The wallet address to search for
   * @returns Promise<Record<string, unknown>[]> - Array of data objects from apiResponse
   */
  async findByWalletAddress(walletAddress: string): Promise<Record<string, unknown>[]> {
    const records = await this.model.find({ 
      wallet: walletAddress, 
      status: GameRecordStatus.UNUSED 
    }).exec();
    
    return records.map(record => {
      // For new format, apiResponse is the record itself
      // For old format, it might be wrapped in data
      const data = record.apiResponse?.data || record.apiResponse;
      return data ? data as Record<string, unknown> : {} as Record<string, unknown>;
    });
  }

  /**
   * Update game record status to Used by recordId
   * @param recordId - The record ID to update
   * @returns Promise<GameRecord | null> - Updated game record or null if not found
   */
  async updateStatusToUsed(recordId: string): Promise<GameRecord | null> {
    return this.model.findOneAndUpdate(
      { recordId: recordId },
      { status: GameRecordStatus.USED },
      { new: true }
    ).exec();
  }

  private extractFields(apiResponse: Record<string, unknown>): {
    recordId?: string;
    gameId?: string;
    wallet?: string;
    signature?: string;
    points?: number;
    nonce?: number;
  } {
    try {
      const root = apiResponse as any;
      // Handle both old format (wrapped in data) and new format (direct record)
      const data = root?.data ?? root?.CreateRecordGame?.data ?? root?.result?.data ?? root;
      if (!data) return {};
      
      const recordId = typeof data.recordId === 'string' ? data.recordId : undefined;
      const gameId = typeof data.gameId === 'string' ? data.gameId : undefined;
      const wallet = typeof data.to === 'string' ? data.to : undefined;
      const signature = typeof data.signature === 'string' ? data.signature : undefined;
      const points = typeof data.points === 'number' ? data.points : undefined;
      const nonce = typeof data.nonce === 'number' ? data.nonce : undefined;
      return { recordId, gameId, wallet, signature, points, nonce };
    } catch {
      return {};
    }
  }
}


