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
exports.AccountController = void 0;
const common_1 = require("@nestjs/common");
const account_service_1 = require("./account.service");
let AccountController = class AccountController {
    accountService;
    constructor(accountService) {
        this.accountService = accountService;
    }
    async getAccounts() {
        return await this.accountService.findAll();
    }
    async createAccount(body) {
        return await this.accountService.create(body);
    }
    async getAccount(id) {
        return await this.accountService.findOne(id);
    }
    async updateAccount(id, body) {
        return await this.accountService.update(id, body);
    }
    async deleteAccount(id) {
        await this.accountService.remove(id);
        return { deleted: true };
    }
    async importAccounts(body) {
        const accounts = Array.isArray(body)
            ? body
            : Array.isArray(body?.accounts)
                ? body.accounts
                : [];
        return await this.accountService.importAccounts(accounts);
    }
    async updateWalletAndUsername(id) {
        return await this.accountService.updateWalletAndUsername(id);
    }
    async addPrivyToken(id, body) {
        return await this.accountService.addPrivyToken(id, body);
    }
    async removePrivyToken(id, gameLabel) {
        return await this.accountService.removePrivyToken(id, gameLabel);
    }
};
exports.AccountController = AccountController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "updateAccount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "importAccounts", null);
__decorate([
    (0, common_1.Patch)(':id/update-wallet-username'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "updateWalletAndUsername", null);
__decorate([
    (0, common_1.Post)(':id/privy-tokens'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "addPrivyToken", null);
__decorate([
    (0, common_1.Delete)(':id/privy-tokens/:gameLabel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('gameLabel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "removePrivyToken", null);
exports.AccountController = AccountController = __decorate([
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [account_service_1.AccountService])
], AccountController);
//# sourceMappingURL=account.controller.js.map