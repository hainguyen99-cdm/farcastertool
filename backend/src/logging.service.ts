import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Log, LogStatus } from './log.schema';
import { ActionType } from './scenario.schema';

export interface CreateLogInput {
  accountId: Types.ObjectId;
  scenarioId: Types.ObjectId;
  actionType: ActionType;
  status: LogStatus;
  error?: string;
  result?: Record<string, unknown>;
}

/**
 * Service responsible for creating and retrieving logs.
 */
@Injectable()
export class LoggingService {
  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
  ) {}

  /**
   * Create a log entry for an action execution result.
   */
  async createLog(data: CreateLogInput): Promise<Log> {
    const log = new this.logModel(data);
    return log.save();
  }

  /**
   * Retrieve logs for a specific account, newest first.
   */
  async getLogsByAccount(accountId: Types.ObjectId): Promise<Log[]> {
    return this.logModel.find({ accountId }).sort({ timestamp: -1 }).exec();
  }

  /**
   * Retrieve logs for a specific scenario, newest first.
   */
  async getLogsByScenario(scenarioId: Types.ObjectId): Promise<Log[]> {
    return this.logModel.find({ scenarioId }).sort({ timestamp: -1 }).exec();
  }

  /**
   * Retrieve logs for an account with pagination metadata.
   */
  async getLogsByAccountPaginated(
    accountId: Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<{ items: Log[]; total: number }> {
    const filter = { accountId } as const;
    const total = await this.logModel.countDocuments(filter).exec();
    const items = await this.logModel
      .find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { items, total };
  }

  /**
   * Retrieve logs for a scenario with pagination metadata.
   */
  async getLogsByScenarioPaginated(
    scenarioId: Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<{ items: Log[]; total: number }> {
    const filter = { scenarioId } as const;
    const total = await this.logModel.countDocuments(filter).exec();
    const items = await this.logModel
      .find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { items, total };
  }

  /**
   * Retrieve logs with optional filters and pagination metadata.
   */
  async getLogsPaginated(
    filters: {
      accountId?: Types.ObjectId;
      scenarioId?: Types.ObjectId;
      actionType?: ActionType;
      status?: LogStatus;
    },
    page: number,
    limit: number,
  ): Promise<{ items: Log[]; total: number }> {
    const mongoFilter: Record<string, unknown> = {};
    if (filters.accountId) {
      mongoFilter.accountId = filters.accountId;
    }
    if (filters.scenarioId) {
      mongoFilter.scenarioId = filters.scenarioId;
    }
    if (filters.actionType) {
      mongoFilter.actionType = filters.actionType;
    }
    if (filters.status) {
      mongoFilter.status = filters.status;
    }
    const total = await this.logModel.countDocuments(mongoFilter).exec();
    const items = await this.logModel
      .find(mongoFilter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { items, total };
  }
}


