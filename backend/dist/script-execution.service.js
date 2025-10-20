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
exports.ScriptExecutionService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const account_schema_1 = require("./account.schema");
const scenario_schema_1 = require("./scenario.schema");
let ScriptExecutionService = class ScriptExecutionService {
    actionsQueue;
    accountModel;
    constructor(actionsQueue, accountModel) {
        this.actionsQueue = actionsQueue;
        this.accountModel = accountModel;
    }
    async executeScript(accountId, actions, options = {}) {
        const account = await this.accountModel.findById(new mongoose_2.Types.ObjectId(accountId)).exec();
        if (!account) {
            throw new Error('Account not found');
        }
        const { loop = 1, shuffle = false } = options;
        const results = [];
        const sortedActions = [...actions].sort((a, b) => a.order - b.order);
        for (let loopIndex = 0; loopIndex < loop; loopIndex++) {
            const actionsToExecute = shuffle
                ? [...sortedActions].sort(() => Math.random() - 0.5)
                : sortedActions;
            for (const action of actionsToExecute) {
                try {
                    const job = await this.actionsQueue.add({
                        accountId: account._id.toString(),
                        scenarioId: new mongoose_2.Types.ObjectId().toString(),
                        action: {
                            type: action.type,
                            config: action.config,
                        },
                        encryptedToken: account.encryptedToken,
                        previousResults: {},
                    }, {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 1000 },
                        removeOnComplete: true,
                        removeOnFail: true,
                    });
                    const result = (await job.finished());
                    results.push({
                        actionType: action.type,
                        success: true,
                        result,
                        loopIndex,
                    });
                }
                catch (error) {
                    results.push({
                        actionType: action.type,
                        success: false,
                        error: error.message,
                        loopIndex,
                    });
                }
            }
        }
        return {
            accountId: account._id.toString(),
            actionsExecuted: results.length,
            loopsExecuted: loop,
            results,
        };
    }
    async executeScriptOnMultipleAccounts(accountIds, actions, options = {}) {
        const results = [];
        for (const accountId of accountIds) {
            try {
                const result = await this.executeScript(accountId, actions, options);
                results.push(result);
            }
            catch (error) {
                results.push({
                    accountId,
                    actionsExecuted: 0,
                    loopsExecuted: 0,
                    results: [{
                            actionType: actions[0]?.type || scenario_schema_1.ActionType.GET_FEED,
                            success: false,
                            error: error.message,
                        }],
                });
            }
        }
        return results;
    }
};
exports.ScriptExecutionService = ScriptExecutionService;
exports.ScriptExecutionService = ScriptExecutionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('actions')),
    __param(1, (0, mongoose_1.InjectModel)(account_schema_1.Account.name)),
    __metadata("design:paramtypes", [Object, mongoose_2.Model])
], ScriptExecutionService);
//# sourceMappingURL=script-execution.service.js.map