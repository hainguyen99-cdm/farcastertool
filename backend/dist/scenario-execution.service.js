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
exports.ScenarioExecutionService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const scenario_schema_1 = require("./scenario.schema");
const account_schema_1 = require("./account.schema");
let ScenarioExecutionService = class ScenarioExecutionService {
    actionsQueue;
    scenarioModel;
    accountModel;
    constructor(actionsQueue, scenarioModel, accountModel) {
        this.actionsQueue = actionsQueue;
        this.scenarioModel = scenarioModel;
        this.accountModel = accountModel;
    }
    async executeScenario(scenarioId, accountIds) {
        const scenario = await this.scenarioModel.findById(new mongoose_2.Types.ObjectId(scenarioId)).exec();
        if (!scenario) {
            throw new Error('Scenario not found');
        }
        const accounts = await this.accountModel
            .find({ _id: { $in: accountIds.map((id) => new mongoose_2.Types.ObjectId(id)) } })
            .exec();
        const results = [];
        for (const account of accounts) {
            let actions = [...(scenario.actions || [])];
            if (scenario.shuffle) {
                actions = this.shuffleArray(actions);
            }
            actions.sort((a, b) => a.order - b.order);
            for (let loop = 0; loop < (scenario.loop || 1); loop++) {
                let previousResults = {};
                for (const action of actions) {
                    const job = await this.actionsQueue.add({
                        accountId: account._id.toString(),
                        scenarioId: scenario._id.toString(),
                        action,
                        encryptedToken: account.encryptedToken,
                        previousResults,
                    }, {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 1000 },
                        removeOnComplete: true,
                        removeOnFail: true,
                        delay: typeof action.config?.['delayBeforeMs'] === 'number'
                            ? action.config['delayBeforeMs']
                            : 0,
                    });
                    const result = (await job.finished());
                    previousResults = result;
                }
            }
            results.push({ accountId: account._id.toString(), loopsRun: scenario.loop || 1 });
        }
        return results;
    }
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
};
exports.ScenarioExecutionService = ScenarioExecutionService;
exports.ScenarioExecutionService = ScenarioExecutionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('actions')),
    __param(1, (0, mongoose_1.InjectModel)(scenario_schema_1.Scenario.name)),
    __param(2, (0, mongoose_1.InjectModel)(account_schema_1.Account.name)),
    __metadata("design:paramtypes", [Object, mongoose_2.Model,
        mongoose_2.Model])
], ScenarioExecutionService);
//# sourceMappingURL=scenario-execution.service.js.map