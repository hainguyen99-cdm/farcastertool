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
exports.LoggingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const log_schema_1 = require("./log.schema");
let LoggingService = class LoggingService {
    logModel;
    constructor(logModel) {
        this.logModel = logModel;
    }
    async createLog(data) {
        const log = new this.logModel(data);
        return log.save();
    }
    async getLogsByAccount(accountId) {
        return this.logModel.find({ accountId }).sort({ timestamp: -1 }).exec();
    }
    async getLogsByScenario(scenarioId) {
        return this.logModel.find({ scenarioId }).sort({ timestamp: -1 }).exec();
    }
    async getLogsByAccountPaginated(accountId, page, limit) {
        const filter = { accountId };
        const total = await this.logModel.countDocuments(filter).exec();
        const items = await this.logModel
            .find(filter)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        return { items, total };
    }
    async getLogsByScenarioPaginated(scenarioId, page, limit) {
        const filter = { scenarioId };
        const total = await this.logModel.countDocuments(filter).exec();
        const items = await this.logModel
            .find(filter)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        return { items, total };
    }
    async getLogsPaginated(filters, page, limit) {
        const mongoFilter = {};
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
};
exports.LoggingService = LoggingService;
exports.LoggingService = LoggingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(log_schema_1.Log.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LoggingService);
//# sourceMappingURL=logging.service.js.map