import { Controller, Get, Param, Patch, Post, Body } from '@nestjs/common';
import { GameRecordService } from './game-record.service';
import { GameRecord } from './game-record.schema';

export interface CreateGameRecordWithTokenDto {
  privitoken: string;
  gameLabel: string;
  wallet: string;
}

/**
 * Controller for managing game records
 */
@Controller('game-records')
export class GameRecordController {
  constructor(private readonly gameRecordService: GameRecordService) {}

  /**
   * Get all unused game records for a specific wallet address
   * @param walletAddress - The wallet address to search for (e.g., 0xBffB550F5980598FBeCb80c0078aB38eF5e2590b)
   * @returns Array of data objects from unused game records
   * @example
   * GET /game-records/wallet/0xBffB550F5980598FBeCb80c0078aB38eF5e2590b
   * Returns: [{"userId": "did:privy:...", "recordId": "...", "gameId": "mazeRunner", "points": 91, ...}]
   */
  @Get('wallet/:walletAddress')
  async getGameRecordsByWallet(@Param('walletAddress') walletAddress: string): Promise<Record<string, unknown>[]> {
    return await this.gameRecordService.findByWalletAddress(walletAddress);
  }

  /**
   * Update game record status to Used by recordId
   * @param recordId - The record ID to update (e.g., 68de4ed95a38e50487dc90e8)
   * @returns Updated game record or null if not found
   * @example
   * PATCH /game-records/68de4ed95a38e50487dc90e8/status/used
   */
  @Patch(':recordId/status/used')
  async updateStatusToUsed(@Param('recordId') recordId: string): Promise<GameRecord | null> {
    return await this.gameRecordService.updateStatusToUsed(recordId);
  }

  /**
   * Create a game record with provided privitoken, gameLabel, and wallet
   * Can save record even if account doesn't exist in database
   * @param createDto - Request body containing privitoken, gameLabel, and wallet
   * @returns Created game record
   * @example
   * POST /game-records/create-with-token
   * Body: { "privitoken": "...", "gameLabel": "mazeRunner", "wallet": "0x..." }
   */
  @Post('create-with-token')
  async createWithToken(@Body() createDto: CreateGameRecordWithTokenDto): Promise<GameRecord[]> {
    return await this.gameRecordService.createWithProvidedToken(createDto);
  }
}
