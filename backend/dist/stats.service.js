"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const account_schema_1 = require("./account.schema");
const scenario_schema_1 = require("./scenario.schema");
const log_schema_1 = require("./log.schema");
let StatsService = class StatsService {
    accountModel;
    scenarioModel;
    logModel;
    constructor(accountModel, scenarioModel, logModel) {
        this.accountModel = accountModel;
        this.scenarioModel = scenarioModel;
        this.logModel = logModel;
    }
    async getDashboardStats() {
        const totalAccounts = await this.accountModel.countDocuments();
        const activeAccounts = await this.accountModel.countDocuments({
            status: account_schema_1.AccountStatus.ACTIVE
        });
        const totalScenarios = await this.scenarioModel.countDocuments();
        const totalExecutions = await this.logModel.countDocuments();
        const successfulExecutions = await this.logModel.countDocuments({
            status: log_schema_1.LogStatus.SUCCESS
        });
        const successRate = totalExecutions > 0
            ? Math.round((successfulExecutions / totalExecutions) * 100)
            : 0;
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
                            $cond: [{ $eq: ['$status', log_schema_1.LogStatus.SUCCESS] }, 1, 0]
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
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(account_schema_1.Account.name)),
    __param(1, (0, mongoose_1.InjectModel)(scenario_schema_1.Scenario.name)),
    __param(2, (0, mongoose_1.InjectModel)(log_schema_1.Log.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], StatsService);
//# sourceMappingURL=stats.service.js.map