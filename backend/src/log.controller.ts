import { Controller, Get, Param, Query } from '@nestjs/common';
import { Types } from 'mongoose';
import { LoggingService } from './logging.service';
import { LogStatus } from './log.schema';
import { ActionType } from './scenario.schema';

@Controller('logs')
export class LogController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get('account/:accountId')
  async getByAccount(
    @Param('accountId') accountId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const objectId = new Types.ObjectId(accountId);
    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '20', 10), 1), 100);
    const { items, total } = await this.loggingService.getLogsByAccountPaginated(objectId, pageNum, limitNum);
    return {
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('scenario/:scenarioId')
  async getByScenario(
    @Param('scenarioId') scenarioId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const objectId = new Types.ObjectId(scenarioId);
    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '20', 10), 1), 100);
    const { items, total } = await this.loggingService.getLogsByScenarioPaginated(objectId, pageNum, limitNum);
    return {
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get()
  async getLogs(
    @Query('accountId') accountId?: string,
    @Query('scenarioId') scenarioId?: string,
    @Query('actionType') actionType?: ActionType,
    @Query('status') status?: LogStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '20', 10), 1), 100);
    const filters: {
      accountId?: Types.ObjectId;
      scenarioId?: Types.ObjectId;
      actionType?: ActionType;
      status?: LogStatus;
    } = {};
    if (accountId) {
      filters.accountId = new Types.ObjectId(accountId);
    }
    if (scenarioId) {
      filters.scenarioId = new Types.ObjectId(scenarioId);
    }
    if (actionType) {
      filters.actionType = actionType;
    }
    if (status) {
      filters.status = status;
    }
    const { items, total } = await this.loggingService.getLogsPaginated(filters, pageNum, limitNum);
    return {
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}


