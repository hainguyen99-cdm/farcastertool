import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bull';
import { ScriptExecutionService } from './script-execution.service';
import { Account } from './account.schema';
import { ActionType } from './scenario.schema';

describe('ScriptExecutionService', () => {
  let service: ScriptExecutionService;
  let accountModel: any;
  let actionsQueue: any;

  const mockAccount = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Account',
    encryptedToken: 'encrypted-token',
    walletAddress: '0x1234567890abcdef',
  };

  const mockActions = [
    {
      type: ActionType.GET_FEED,
      config: {},
      order: 0,
    },
    {
      type: ActionType.DELAY,
      config: { durationMs: 1000 },
      order: 1,
    },
  ];

  beforeEach(async () => {
    const mockAccountModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAccount),
      }),
    };

    const mockQueue = {
      add: jest.fn().mockResolvedValue({
        finished: jest.fn().mockResolvedValue({ result: 'success' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScriptExecutionService,
        {
          provide: getModelToken(Account.name),
          useValue: mockAccountModel,
        },
        {
          provide: getQueueToken('actions'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<ScriptExecutionService>(ScriptExecutionService);
    accountModel = module.get(getModelToken(Account.name));
    actionsQueue = module.get(getQueueToken('actions'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeScript', () => {
    it('should execute script with default options (loop=1, shuffle=false)', async () => {
      const result = await service.executeScript('507f1f77bcf86cd799439011', mockActions);

      expect(result.accountId).toBe('507f1f77bcf86cd799439011');
      expect(result.actionsExecuted).toBe(2);
      expect(result.loopsExecuted).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(actionsQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should execute script with custom loop count', async () => {
      const result = await service.executeScript('507f1f77bcf86cd799439011', mockActions, { loop: 3 });

      expect(result.accountId).toBe('507f1f77bcf86cd799439011');
      expect(result.actionsExecuted).toBe(6); // 2 actions * 3 loops
      expect(result.loopsExecuted).toBe(3);
      expect(result.results).toHaveLength(6);
      expect(actionsQueue.add).toHaveBeenCalledTimes(6);
    });

    it('should execute script with shuffle enabled', async () => {
      const result = await service.executeScript('507f1f77bcf86cd799439011', mockActions, { shuffle: true });

      expect(result.accountId).toBe('507f1f77bcf86cd799439011');
      expect(result.actionsExecuted).toBe(2);
      expect(result.loopsExecuted).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(actionsQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should execute script with both loop and shuffle', async () => {
      const result = await service.executeScript('507f1f77bcf86cd799439011', mockActions, { loop: 2, shuffle: true });

      expect(result.accountId).toBe('507f1f77bcf86cd799439011');
      expect(result.actionsExecuted).toBe(4); // 2 actions * 2 loops
      expect(result.loopsExecuted).toBe(2);
      expect(result.results).toHaveLength(4);
      expect(actionsQueue.add).toHaveBeenCalledTimes(4);
    });

    it('should handle account not found', async () => {
      accountModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.executeScript('507f1f77bcf86cd799439011', mockActions)).rejects.toThrow('Account not found');
    });

    it('should handle action execution errors', async () => {
      actionsQueue.add.mockRejectedValue(new Error('Action failed'));

      const result = await service.executeScript('507f1f77bcf86cd799439011', mockActions);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('Action failed');
    });
  });

  describe('executeScriptOnMultipleAccounts', () => {
    it('should execute script on multiple accounts with options', async () => {
      const accountIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      const result = await service.executeScriptOnMultipleAccounts(accountIds, mockActions, { loop: 2 });

      expect(result).toHaveLength(2);
      expect(result[0].loopsExecuted).toBe(2);
      expect(result[1].loopsExecuted).toBe(2);
      expect(actionsQueue.add).toHaveBeenCalledTimes(8); // 2 accounts * 2 actions * 2 loops
    });
  });
});
