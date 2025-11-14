import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameRecord, GameRecordStatus } from './game-record.schema';
import { SignatureHeaderService } from './signature-header.service';
import { Account, AccountStatus } from './account.schema';
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

@Injectable()
export class GameRecordService {
  constructor(
    @InjectModel(GameRecord.name) private readonly model: Model<GameRecord>,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    private readonly signatureHeaderService: SignatureHeaderService,
    private readonly encryptionService: EncryptionService,
  ) {}

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

  /**
   * Create a game record with provided privitoken, gameLabel, and wallet
   * Can save record even if account doesn't exist in database
   * @param input - Input containing privitoken, gameLabel, and wallet
   * @returns Created game record
   */
  async createWithProvidedToken(input: CreateGameRecordWithTokenInput): Promise<GameRecord[]> {
    const { privitoken, gameLabel, wallet } = input;
    
    // Find or create account by wallet address
    let account = await this.accountModel.findOne({ walletAddress: wallet }).exec();
    
    if (!account) {
      // Create a minimal account if it doesn't exist
      const placeholderEncryptedToken = this.encryptionService.encrypt('external-game-record');
      account = new this.accountModel({
        name: `Wallet-${wallet.substring(0, 8)}`,
        encryptedToken: placeholderEncryptedToken,
        status: AccountStatus.ACTIVE,
        walletAddress: wallet,
      });
      account = await account.save();
    }
    
    const accountId = account._id.toString();
    
    // Build payload and headers for API call
    const payload = JSON.stringify({ wallet });
    const apiKey = process.env.RPC_VERSION_API_KEY || '';
    const secret = process.env.RPC_VERSION_SECRET || process.env.RPC_VERSION_SECRET_KEY || '';
    
    if (!apiKey || !secret) {
      throw new Error('Missing RPC_VERSION_API_KEY or RPC_VERSION_SECRET in env');
    }
    
    const signature = this.signatureHeaderService.generateSignature(apiKey, secret, payload);
    if (!signature) {
      throw new Error('Failed to generate signature');
    }
    
    // Make API call
    const axios = await import('axios');
    const response = await axios.default.post(
      'https://maze-api.uptopia.xyz/api/v1/bot/signature',
      { wallet },
      {
        headers: {
          'accept': '*/*',
          'x-api-key': apiKey,
          'signature': signature,
          'Authorization': `Bearer ${privitoken}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      },
    );
    
    // Handle response data - could be array or single object
    const responseData = response.data as Record<string, unknown>;
    console.log('CREATE_RECORD_GAME API Response:', JSON.stringify(responseData, null, 2));
    
    // Extract records consistent with action processor
    let records: Record<string, unknown>[] = [];
    if (Array.isArray((responseData as any)?.data)) {
      records = (responseData as any).data as Record<string, unknown>[];
      console.log(`Found ${records.length} records in responseData.data`);
    } else if (Array.isArray(responseData)) {
      records = responseData as unknown as Record<string, unknown>[];
      console.log(`Found ${records.length} records in direct array response`);
    } else {
      records = [responseData];
      console.log('Single record response, wrapping in array');
    }
    
    if (records.length === 0) {
      throw new Error('No records returned from API');
    }
    
    // Build inputs for persistence
    const gameRecordInputs = records.map(record => ({
      accountId,
      gameLabel,
      apiResponse: record,
    }));
    
    let savedRecords: GameRecord[] = [];
    try {
      savedRecords = await this.createUnusedBulk(gameRecordInputs);
      console.log(`Successfully saved ${savedRecords.length} game records via bulk operation`);
    } catch (bulkError) {
      console.error('Bulk save failed, trying individual saves:', bulkError);
      for (const inputItem of gameRecordInputs) {
        try {
          const savedRecord = await this.createUnused(inputItem);
          savedRecords.push(savedRecord);
        } catch (individualError) {
          console.error('Failed to save individual record:', individualError);
        }
      }
      console.log(`Individual save completed: ${savedRecords.length} records saved`);
    }
    
    return savedRecords;
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


