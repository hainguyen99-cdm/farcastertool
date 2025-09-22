import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountStatus } from './account.schema';
import { Scenario } from './scenario.schema';
import { Log, LogStatus } from './log.schema';

export interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  totalScenarios: number;
  totalExecutions: number;
  successRate: number;
  recentLogs: Array<{
    _id: string;
    accountId: string;
    scenarioId: string;
    timestamp: Date;
    accountName: string;
    scenarioName: string;
    actionType: string;
    status: string;
  }>;
  actionDistribution: Array<{
    actionType: string;
    count: number;
  }>;
  executionTrends: Array<{
    date: string;
    executions: number;
    successes: number;
  }>;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
    @InjectModel(Scenario.name) private scenarioModel: Model<Scenario>,
    @InjectModel(Log.name) private logModel: Model<Log>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Get account statistics
    const totalAccounts = await this.accountModel.countDocuments();
    const activeAccounts = await this.accountModel.countDocuments({ 
      status: AccountStatus.ACTIVE 
    });

    // Get scenario statistics
    const totalScenarios = await this.scenarioModel.countDocuments();

    // Get execution statistics
    const totalExecutions = await this.logModel.countDocuments();
    const successfulExecutions = await this.logModel.countDocuments({ 
      status: LogStatus.SUCCESS 
    });
    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100) 
      : 0;

    // Get recent logs with account names
    const recentLogs = await this.logModel
      .aggregate([
        {
          $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account'
          }
        },
        {
          $lookup: {
            from: 'scenarios',
            localField: 'scenarioId',
            foreignField: '_id',
            as: 'scenario'
          }
        },
        {
          $project: {
            _id: 1,
            accountId: 1,
            scenarioId: 1,
            timestamp: 1,
            actionType: 1,
            status: 1,
            accountName: { $arrayElemAt: ['$account.name', 0] },
            scenarioName: { $arrayElemAt: ['$scenario.name', 0] }
          }
        },
        { $sort: { timestamp: -1 } },
        { $limit: 10 }
      ])
      .exec();

    // Get action distribution
    const actionDistribution = await this.logModel
      .aggregate([
        {
          $group: {
            _id: '$actionType',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            actionType: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ])
      .exec();

    // Get execution trends for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const executionTrends = await this.logModel
      .aggregate([
        {
          $match: {
            timestamp: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$timestamp'
                }
              }
            },
            executions: { $sum: 1 },
            successes: {
              $sum: {
                $cond: [{ $eq: ['$status', LogStatus.SUCCESS] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            date: '$_id.date',
            executions: 1,
            successes: 1,
            _id: 0
          }
        },
        { $sort: { date: 1 } }
      ])
      .exec();

    return {
      totalAccounts,
      activeAccounts,
      totalScenarios,
      totalExecutions,
      successRate,
      recentLogs: recentLogs.map(log => ({
        _id: log._id.toString(),
        accountId: log.accountId?.toString?.() ?? '',
        scenarioId: log.scenarioId?.toString?.() ?? '',
        timestamp: log.timestamp,
        accountName: log.accountName || 'Unknown',
        scenarioName: log.scenarioName || 'Unknown',
        actionType: log.actionType,
        status: log.status,
      })),
      actionDistribution: actionDistribution.map(item => ({
        actionType: item.actionType || 'Unknown',
        count: item.count,
      })),
      executionTrends: executionTrends.map(trend => ({
        date: trend.date,
        executions: trend.executions,
        successes: trend.successes,
      })),
    };
  }
}
