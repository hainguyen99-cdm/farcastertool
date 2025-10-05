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
exports.AccountService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const account_schema_1 = require("./account.schema");
const encryption_service_1 = require("./encryption.service");
const farcaster_service_1 = require("./farcaster.service");
let AccountService = class AccountService {
    accountModel;
    encryptionService;
    farcasterService;
    constructor(accountModel, encryptionService, farcasterService) {
        this.accountModel = accountModel;
        this.encryptionService = encryptionService;
        this.farcasterService = farcasterService;
    }
    async create(createAccountDto) {
        const encryptedToken = this.encryptionService.encrypt(createAccountDto.token);
        const account = new this.accountModel({
            name: createAccountDto.name,
            encryptedToken,
            status: account_schema_1.AccountStatus.ACTIVE,
        });
        return account.save();
    }
    async findAll() {
        return this.accountModel.find().exec();
    }
    async findOne(id) {
        const account = await this.accountModel.findById(id).exec();
        if (!account) {
            throw new common_1.NotFoundException(`Account with ID ${id} not found`);
        }
        return account;
    }
    async update(id, updateAccountDto) {
        const updateData = { ...updateAccountDto };
        if (updateAccountDto.token) {
            updateData.encryptedToken = this.encryptionService.encrypt(updateAccountDto.token);
            delete updateData.token;
        }
        if (updateAccountDto.privyTokens) {
            const encryptedPrivyTokens = updateAccountDto.privyTokens.map(pt => ({
                gameLabel: pt.gameLabel,
                encryptedPrivyToken: this.encryptionService.encrypt(pt.privyToken)
            }));
            updateData.privyTokens = encryptedPrivyTokens;
        }
        const account = await this.accountModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!account) {
            throw new common_1.NotFoundException(`Account with ID ${id} not found`);
        }
        return account;
    }
    async remove(id) {
        const result = await this.accountModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException(`Account with ID ${id} not found`);
        }
    }
    async getDecryptedToken(id) {
        const account = await this.findOne(id);
        return this.encryptionService.decrypt(account.encryptedToken);
    }
    async updateLastUsed(id) {
        await this.accountModel.findByIdAndUpdate(id, { lastUsed: new Date() }).exec();
    }
    async updateStatus(id, status, error) {
        const updateData = { status };
        if (error) {
            updateData.error = error;
        }
        const account = await this.accountModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!account) {
            throw new common_1.NotFoundException(`Account with ID ${id} not found`);
        }
        return account;
    }
    async importAccounts(accounts) {
        const errors = [];
        let success = 0;
        for (const accountData of accounts) {
            try {
                const encryptedToken = this.encryptionService.encrypt(accountData.token);
                const account = new this.accountModel({
                    name: accountData.name,
                    encryptedToken,
                    status: accountData.status || account_schema_1.AccountStatus.ACTIVE,
                });
                await account.save();
                success++;
            }
            catch (error) {
                errors.push(`Failed to import account "${accountData.name}": ${error.message}`);
            }
        }
        return { success, errors };
    }
    async updateWalletAndUsername(id) {
        const account = await this.findOne(id);
        try {
            const { walletAddress, username } = await this.farcasterService.getOnboardingState(account.encryptedToken);
            const updatedAccount = await this.accountModel
                .findByIdAndUpdate(id, {
                walletAddress,
                username,
                lastUsed: new Date(),
            }, { new: true })
                .exec();
            if (!updatedAccount) {
                throw new common_1.NotFoundException(`Account with ID ${id} not found`);
            }
            return updatedAccount;
        }
        catch (error) {
            await this.updateStatus(id, account_schema_1.AccountStatus.ERROR, `Failed to update wallet and username: ${error.message}`);
            throw error;
        }
    }
    async addPrivyToken(id, addPrivyTokenDto) {
        const account = await this.findOne(id);
        const encryptedPrivyToken = this.encryptionService.encrypt(addPrivyTokenDto.privyToken);
        const privyToken = {
            gameLabel: addPrivyTokenDto.gameLabel,
            encryptedPrivyToken,
        };
        const updatedAccount = await this.accountModel
            .findByIdAndUpdate(id, {
            $push: {
                privyTokens: {
                    gameLabel: privyToken.gameLabel,
                    encryptedPrivyToken: privyToken.encryptedPrivyToken
                }
            }
        }, { new: true })
            .exec();
        if (!updatedAccount) {
            throw new common_1.NotFoundException(`Account with ID ${id} not found`);
        }
        return updatedAccount;
    }
    async removePrivyToken(id, gameLabel) {
        const account = await this.findOne(id);
        const updatedAccount = await this.accountModel
            .findByIdAndUpdate(id, { $pull: { privyTokens: { gameLabel } } }, { new: true })
            .exec();
        if (!updatedAccount) {
            throw new common_1.NotFoundException(`Account with ID ${id} not found`);
        }
        return updatedAccount;
    }
    async getDecryptedPrivyToken(id, gameLabel) {
        const account = await this.findOne(id);
        const privyToken = account.privyTokens.find(pt => pt.gameLabel === gameLabel);
        if (!privyToken) {
            throw new common_1.NotFoundException(`Privy token with game label "${gameLabel}" not found for account ${id}`);
        }
        return this.encryptionService.decrypt(privyToken.encryptedPrivyToken);
    }
};
exports.AccountService = AccountService;
exports.AccountService = AccountService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(account_schema_1.Account.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        encryption_service_1.EncryptionService,
        farcaster_service_1.FarcasterService])
], AccountService);
//# sourceMappingURL=account.service.js.map