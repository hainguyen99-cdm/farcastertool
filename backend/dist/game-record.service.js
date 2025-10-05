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
let GameRecordService = class GameRecordService {
    model;
    constructor(model) {
        this.model = model;
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
    extractFields(apiResponse) {
        try {
            const root = apiResponse;
            const data = root?.data ?? root?.CreateRecordGame?.data ?? root?.result?.data ?? undefined;
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
    __metadata("design:paramtypes", [mongoose_2.Model])
], GameRecordService);
//# sourceMappingURL=game-record.service.js.map