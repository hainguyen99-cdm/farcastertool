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
exports.ScriptController = void 0;
const common_1 = require("@nestjs/common");
const script_execution_service_1 = require("./script-execution.service");
const account_service_1 = require("./account.service");
const farcaster_service_1 = require("./farcaster.service");
let ScriptController = class ScriptController {
    scriptExecutionService;
    accountService;
    farcasterService;
    constructor(scriptExecutionService, accountService, farcasterService) {
        this.scriptExecutionService = scriptExecutionService;
        this.accountService = accountService;
        this.farcasterService = farcasterService;
    }
    async executeScript(body) {
        return await this.scriptExecutionService.executeScript(body.accountId, body.actions, body.options);
    }
    async executeScriptOnMultipleAccounts(body) {
        return await this.scriptExecutionService.executeScriptOnMultipleAccounts(body.accountIds, body.actions, body.options);
    }
    async debugAccountReadiness(accountId, gameLabel) {
        const readiness = await this.accountService.checkCreateRecordGameReadiness(accountId, gameLabel);
        const account = await this.accountService.findOne(accountId);
        return {
            accountId,
            gameLabel,
            readiness,
            account: {
                id: account._id?.toString() || accountId,
                name: account.name,
                walletAddress: account.walletAddress,
                privyTokens: account.privyTokens?.map(pt => ({
                    gameLabel: pt.gameLabel,
                    hasToken: !!pt.encryptedPrivyToken
                })) || []
            }
        };
    }
    async generateImageUploadUrl(body) {
        if (!body?.accountId) {
            throw new Error('accountId is required');
        }
        const account = await this.accountService.findOne(body.accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        return await this.farcasterService.generateImageUploadUrl(account.encryptedToken);
    }
};
exports.ScriptController = ScriptController;
__decorate([
    (0, common_1.Post)('execute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScriptController.prototype, "executeScript", null);
__decorate([
    (0, common_1.Post)('execute-multiple'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScriptController.prototype, "executeScriptOnMultipleAccounts", null);
__decorate([
    (0, common_1.Get)('debug/:accountId/:gameLabel'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Param)('gameLabel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ScriptController.prototype, "debugAccountReadiness", null);
__decorate([
    (0, common_1.Post)('generate-image-upload-url'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScriptController.prototype, "generateImageUploadUrl", null);
exports.ScriptController = ScriptController = __decorate([
    (0, common_1.Controller)('scripts'),
    __metadata("design:paramtypes", [script_execution_service_1.ScriptExecutionService,
        account_service_1.AccountService,
        farcaster_service_1.FarcasterService])
], ScriptController);
//# sourceMappingURL=script.controller.js.map