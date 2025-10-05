import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GameRecordService } from './game-record.service';
import { GameRecord } from './game-record.schema';

describe('GameRecordService', () => {
  let service: GameRecordService;
  let model: any;

  const mockGameRecord = {
    _id: '507f1f77bcf86cd799439011',
    accountId: '507f1f77bcf86cd799439012',
    gameLabel: 'test-game',
    wallet: '0xBffB550F5980598FBeCb80c0078aB38eF5e2590b',
    status: 'Unused',
    apiResponse: { 
      data: { 
        userId: 'did:privy:cmg93ggib01dbld0c9bfo3505',
        recordId: '68de4ed95a38e50487dc90e8',
        gameId: 'mazeRunner',
        points: 91,
        nonce: 1759399641,
        to: '0xBffB550F5980598FBeCb80c0078aB38eF5e2590b',
        signature: '0x030db41628a6e3594db773f3be639f23facab0c70f03e8658bd99710591bbf6615de55e5456bb7952db7ff6620df3f8977a304053dc689dde8bf5c26520db7291b'
      } 
    },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockGameRecord]),
      }),
      findOneAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGameRecord),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameRecordService,
        {
          provide: getModelToken(GameRecord.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<GameRecordService>(GameRecordService);
    model = module.get(getModelToken(GameRecord.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByWalletAddress', () => {
    it('should return data objects from unused game records for a given wallet address', async () => {
      const walletAddress = '0xBffB550F5980598FBeCb80c0078aB38eF5e2590b';
      const result = await service.findByWalletAddress(walletAddress);
      
      expect(model.find).toHaveBeenCalledWith({ 
        wallet: walletAddress, 
        status: 'Unused' 
      });
      expect(result).toEqual([mockGameRecord.apiResponse.data]);
    });

    it('should return empty array when no unused records found', async () => {
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const walletAddress = '0xNonExistentWallet';
      const result = await service.findByWalletAddress(walletAddress);
      
      expect(result).toEqual([]);
    });

    it('should filter out used records', async () => {
      const usedRecord = { ...mockGameRecord, status: 'Used' };
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([usedRecord]),
      });

      const walletAddress = '0xBffB550F5980598FBeCb80c0078aB38eF5e2590b';
      const result = await service.findByWalletAddress(walletAddress);
      
      expect(model.find).toHaveBeenCalledWith({ 
        wallet: walletAddress, 
        status: 'Unused' 
      });
      expect(result).toEqual([]);
    });
  });

  describe('updateStatusToUsed', () => {
    it('should update game record status to Used by recordId', async () => {
      const recordId = '68de4ed95a38e50487dc90e8';
      const updatedRecord = { ...mockGameRecord, status: 'Used' };
      
      model.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedRecord),
      });

      const result = await service.updateStatusToUsed(recordId);
      
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { recordId: recordId },
        { status: 'Used' },
        { new: true }
      );
      expect(result).toEqual(updatedRecord);
    });

    it('should return null when record not found', async () => {
      const recordId = 'non-existent-record';
      
      model.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.updateStatusToUsed(recordId);
      
      expect(result).toBeNull();
    });
  });
});
