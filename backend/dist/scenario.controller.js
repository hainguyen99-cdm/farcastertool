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
exports.ScenarioController = void 0;
const common_1 = require("@nestjs/common");
const scenario_service_1 = require("./scenario.service");
const scenario_execution_service_1 = require("./scenario-execution.service");
let ScenarioController = class ScenarioController {
    scenarioService;
    scenarioExecutionService;
    constructor(scenarioService, scenarioExecutionService) {
        this.scenarioService = scenarioService;
        this.scenarioExecutionService = scenarioExecutionService;
    }
    async createScenario(body) {
        return await this.scenarioService.createScenario(body);
    }
    async getScenarios() {
        return await this.scenarioService.getScenarios();
    }
    async getScenario(id) {
        return await this.scenarioService.getScenarioById(id);
    }
    async updateScenario(id, body) {
        return await this.scenarioService.updateScenario(id, body);
    }
    async deleteScenario(id) {
        return await this.scenarioService.deleteScenario(id);
    }
    async reorderActions(id, body) {
        return await this.scenarioService.reorderActionsByIds(id, body.orderedActionIds);
    }
    async moveAction(id, actionId, body) {
        return await this.scenarioService.moveActionToIndex(id, actionId, body.toIndex);
    }
    async normalizeOrders(id) {
        return await this.scenarioService.normalizeActionOrders(id);
    }
    async executeScenario(id, body) {
        const accountIds = Array.isArray(body?.accountIds) ? body.accountIds : [];
        const results = await this.scenarioExecutionService.executeScenario(id, accountIds);
        return { executed: true, results };
    }
};
exports.ScenarioController = ScenarioController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "createScenario", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "getScenarios", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "getScenario", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "updateScenario", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "deleteScenario", null);
__decorate([
    (0, common_1.Patch)(':id/actions/order'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "reorderActions", null);
__decorate([
    (0, common_1.Patch)(':id/actions/:actionId/move'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('actionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "moveAction", null);
__decorate([
    (0, common_1.Patch)(':id/actions/normalize'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "normalizeOrders", null);
__decorate([
    (0, common_1.Post)(':id/execute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScenarioController.prototype, "executeScenario", null);
exports.ScenarioController = ScenarioController = __decorate([
    (0, common_1.Controller)('scenarios'),
    __metadata("design:paramtypes", [scenario_service_1.ScenarioService,
        scenario_execution_service_1.ScenarioExecutionService])
], ScenarioController);
//# sourceMappingURL=scenario.controller.js.map