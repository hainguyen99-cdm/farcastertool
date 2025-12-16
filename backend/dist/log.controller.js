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
exports.LogController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const logging_service_1 = require("./logging.service");
const log_schema_1 = require("./log.schema");
const scenario_schema_1 = require("./scenario.schema");
let LogController = class LogController {
    loggingService;
    constructor(loggingService) {
        this.loggingService = loggingService;
    }
    async getByAccount(accountId, page = '1', limit = '20') {
        const objectId = new mongoose_1.Types.ObjectId(accountId);
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
    async getByScenario(scenarioId, page = '1', limit = '20') {
        const objectId = new mongoose_1.Types.ObjectId(scenarioId);
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
    async getLogs(accountId, scenarioId, actionType, status, page = '1', limit = '20') {
        const pageNum = Math.max(parseInt(page || '1', 10), 1);
        const limitNum = Math.min(Math.max(parseInt(limit || '20', 10), 1), 100);
        const filters = {};
        if (accountId) {
            filters.accountId = new mongoose_1.Types.ObjectId(accountId);
        }
        if (scenarioId) {
            filters.scenarioId = new mongoose_1.Types.ObjectId(scenarioId);
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
};
exports.LogController = LogController;
__decorate([
    (0, common_1.Get)('account/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogController.prototype, "getByAccount", null);
__decorate([
    (0, common_1.Get)('scenario/:scenarioId'),
    __param(0, (0, common_1.Param)('scenarioId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogController.prototype, "getByScenario", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('accountId')),
    __param(1, (0, common_1.Query)('scenarioId')),
    __param(2, (0, common_1.Query)('actionType')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogController.prototype, "getLogs", null);
exports.LogController = LogController = __decorate([
    (0, common_1.Controller)('logs'),
    __metadata("design:paramtypes", [logging_service_1.LoggingService])
], LogController);
//# sourceMappingURL=log.controller.js.map