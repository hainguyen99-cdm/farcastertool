import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GameRecordController } from './game-record.controller';
import { GameRecordService } from './game-record.service';
import { GameRecord } from './game-record.schema';

describe('GameRecordController', () => {
  let controller: GameRecordController;
  let service: GameRecordService;

  const mockDataObject = {
    userId: 'did:privy:cmg93ggib01dbld0c9bfo3505',
    recordId: '68de4ed95a38e50487dc90e8',
    gameId: 'mazeRunner',
    points: 91,
    nonce: 1759399641,
    to: '0xBffB550F5980598FBeCb80c0078aB38eF5e2590b',
    signature: '0x030db41628a6e3594db773f3be639f23facab0c70f03e8658bd99710591bbf6615de55e5456bb7952db7ff6620df3f8977a304053dc689dde8bf5c26520db7291b'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameRecordController],
      providers: [
        GameRecordService,
        {
          provide: getModelToken(GameRecord.name),
          useValue: {
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockDataObject]),
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<GameRecordController>(GameRecordController);
    service = module.get<GameRecordService>(GameRecordService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGameRecordsByWallet', () => {
    it('should return data objects from unused game records for a given wallet address', async () => {
      const walletAddress = '0xBffB550F5980598FBeCb80c0078aB38eF5e2590b';
      const result = await controller.getGameRecordsByWallet(walletAddress);
      
      expect(result).toEqual([mockDataObject]);
    });
  });

  describe('updateStatusToUsed', () => {
    it('should update game record status to Used by recordId', async () => {
      const recordId = '68de4ed95a38e50487dc90e8';
      const mockUpdatedRecord = {
        _id: '507f1f77bcf86cd799439011',
        accountId: '507f1f77bcf86cd799439012',
        gameLabel: 'test-game',
        recordId: recordId,
        status: 'Used',
        apiResponse: { data: mockDataObject },
        createdAt: new Date(),
      };

      jest.spyOn(service, 'updateStatusToUsed').mockResolvedValue(mockUpdatedRecord as any);

      const result = await controller.updateStatusToUsed(recordId);
      
      expect(service.updateStatusToUsed).toHaveBeenCalledWith(recordId);
      expect(result).toEqual(mockUpdatedRecord);
    });

    it('should return null when record not found', async () => {
      const recordId = 'non-existent-record';
      
      jest.spyOn(service, 'updateStatusToUsed').mockResolvedValue(null);

      const result = await controller.updateStatusToUsed(recordId);
      
      expect(result).toBeNull();
    });
  });
});
