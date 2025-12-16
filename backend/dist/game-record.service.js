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
exports.GameRecordService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const game_record_schema_1 = require("./game-record.schema");
const signature_header_service_1 = require("./signature-header.service");
const account_schema_1 = require("./account.schema");
const encryption_service_1 = require("./encryption.service");
let GameRecordService = class GameRecordService {
    model;
    accountModel;
    signatureHeaderService;
    encryptionService;
    constructor(model, accountModel, signatureHeaderService, encryptionService) {
        this.model = model;
        this.accountModel = accountModel;
        this.signatureHeaderService = signatureHeaderService;
        this.encryptionService = encryptionService;
    }
    async createUnused(input) {
        const pieces = this.extractFields(input.apiResponse);
        const filter = {
            accountId: new mongoose_2.Types.ObjectId(input.accountId),
            ...(pieces.recordId ? { recordId: pieces.recordId } : {}),
            ...(!pieces.recordId && pieces.nonce != null ? { gameLabel: input.gameLabel, nonce: pieces.nonce } : {}),
        };
        const update = {
            accountId: new mongoose_2.Types.ObjectId(input.accountId),
            gameLabel: input.gameLabel,
            status: game_record_schema_1.GameRecordStatus.UNUSED,
            apiResponse: input.apiResponse,
            ...pieces,
        };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };
        return this.model.findOneAndUpdate(filter, update, options).exec();
    }
    async createUnusedBulk(inputs) {
        if (inputs.length === 0) {
            return [];
        }
        try {
            console.log(`Processing ${inputs.length} records from API response`);
            const operations = inputs.map(input => {
                const pieces = this.extractFields(input.apiResponse);
                const filter = {
                    accountId: new mongoose_2.Types.ObjectId(input.accountId),
                    ...(pieces.recordId ? { recordId: pieces.recordId } : {}),
                };
                const update = {
                    accountId: new mongoose_2.Types.ObjectId(input.accountId),
                    gameLabel: input.gameLabel,
                    status: game_record_schema_1.GameRecordStatus.UNUSED,
                    apiResponse: input.apiResponse,
                    ...pieces,
                };
                return {
                    updateOne: {
                        filter,
                        update,
                        upsert: true,
                    },
                };
            });
            await this.model.bulkWrite(operations);
            const accountId = inputs[0]?.accountId;
            const gameLabel = inputs[0]?.gameLabel;
            if (accountId && gameLabel) {
                return this.model.find({
                    accountId: new mongoose_2.Types.ObjectId(accountId),
                    gameLabel,
                    status: game_record_schema_1.GameRecordStatus.UNUSED
                }).sort({ createdAt: -1 }).limit(inputs.length).exec();
            }
            return [];
        }
        catch (error) {
            console.error('Error in createUnusedBulk:', error);
            throw error;
        }
    }
    async findByWalletAddress(walletAddress) {
        const records = await this.model.find({
            wallet: walletAddress,
            status: game_record_schema_1.GameRecordStatus.UNUSED
        }).exec();
        return records.map(record => {
            const data = record.apiResponse?.data || record.apiResponse;
            return data ? data : {};
        });
    }
    async updateStatusToUsed(recordId) {
        return this.model.findOneAndUpdate({ recordId: recordId }, { status: game_record_schema_1.GameRecordStatus.USED }, { new: true }).exec();
    }
    async createWithProvidedToken(input) {
        const { privitoken, gameLabel, wallet } = input;
        let account = await this.accountModel.findOne({ walletAddress: wallet }).exec();
        if (!account) {
            const placeholderEncryptedToken = this.encryptionService.encrypt('external-game-record');
            account = new this.accountModel({
                name: `Wallet-${wallet.substring(0, 8)}`,
                encryptedToken: placeholderEncryptedToken,
                status: account_schema_1.AccountStatus.ACTIVE,
                walletAddress: wallet,
            });
            account = await account.save();
        }
        const accountId = account._id.toString();
        const payload = JSON.stringify({ wallet });
        const apiKey = process.env.RPC_VERSION_API_KEY || '';
        const secret = process.env.RPC_VERSION_SECRET || process.env.RPC_VERSION_SECRET_KEY || '';
        if (!apiKey || !secret) {
            throw new Error('Missing RPC_VERSION_API_KEY or RPC_VERSION_SECRET in env');
        }
        const signature = this.signatureHeaderService.generateSignature(apiKey, secret, payload);
        if (!signature) {
            throw new Error('Failed to generate signature');
        }
        const axios = await Promise.resolve().then(() => require('axios'));
        const response = await axios.default.post('https://maze-api.uptopia.xyz/api/v1/bot/signature', { wallet }, {
            headers: {
                'accept': '*/*',
                'x-api-key': apiKey,
                'signature': signature,
                'Authorization': `Bearer ${privitoken}`,
                'Content-Type': 'application/json',
            },
            timeout: 20000,
        });
        const responseData = response.data;
        console.log('CREATE_RECORD_GAME API Response:', JSON.stringify(responseData, null, 2));
        let records = [];
        if (Array.isArray(responseData?.data)) {
            records = responseData.data;
            console.log(`Found ${records.length} records in responseData.data`);
        }
        else if (Array.isArray(responseData)) {
            records = responseData;
            console.log(`Found ${records.length} records in direct array response`);
        }
        else {
            records = [responseData];
            console.log('Single record response, wrapping in array');
        }
        if (records.length === 0) {
            throw new Error('No records returned from API');
        }
        const gameRecordInputs = records.map(record => ({
            accountId,
            gameLabel,
            apiResponse: record,
        }));
        let savedRecords = [];
        try {
            savedRecords = await this.createUnusedBulk(gameRecordInputs);
            console.log(`Successfully saved ${savedRecords.length} game records via bulk operation`);
        }
        catch (bulkError) {
            console.error('Bulk save failed, trying individual saves:', bulkError);
            for (const inputItem of gameRecordInputs) {
                try {
                    const savedRecord = await this.createUnused(inputItem);
                    savedRecords.push(savedRecord);
                }
                catch (individualError) {
                    console.error('Failed to save individual record:', individualError);
                }
            }
            console.log(`Individual save completed: ${savedRecords.length} records saved`);
        }
        return savedRecords;
    }
    extractFields(apiResponse) {
        try {
            const root = apiResponse;
            const data = root?.data ?? root?.CreateRecordGame?.data ?? root?.result?.data ?? root;
            if (!data)
                return {};
            const recordId = typeof data.recordId === 'string' ? data.recordId : undefined;
            const gameId = typeof data.gameId === 'string' ? data.gameId : undefined;
            const wallet = typeof data.to === 'string' ? data.to : undefined;
            const signature = typeof data.signature === 'string' ? data.signature : undefined;
            const points = typeof data.points === 'number' ? data.points : undefined;
            const nonce = typeof data.nonce === 'number' ? data.nonce : undefined;
            return { recordId, gameId, wallet, signature, points, nonce };
        }
        catch {
            return {};
        }
    }
};
exports.GameRecordService = GameRecordService;
exports.GameRecordService = GameRecordService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(game_record_schema_1.GameRecord.name)),
    __param(1, (0, mongoose_1.InjectModel)(account_schema_1.Account.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        signature_header_service_1.SignatureHeaderService,
        encryption_service_1.EncryptionService])
], GameRecordService);
//# sourceMappingURL=game-record.service.js.map