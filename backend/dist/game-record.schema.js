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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRecordSchema = exports.GameRecord = exports.GameRecordStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var GameRecordStatus;
(function (GameRecordStatus) {
    GameRecordStatus["UNUSED"] = "Unused";
    GameRecordStatus["USED"] = "Used";
})(GameRecordStatus || (exports.GameRecordStatus = GameRecordStatus = {}));
let GameRecord = class GameRecord {
    accountId;
    gameLabel;
    recordId;
    gameId;
    wallet;
    signature;
    points;
    nonce;
    status;
    apiResponse;
    createdAt;
};
exports.GameRecord = GameRecord;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Account', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], GameRecord.prototype, "accountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GameRecord.prototype, "gameLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], GameRecord.prototype, "recordId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], GameRecord.prototype, "gameId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], GameRecord.prototype, "wallet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], GameRecord.prototype, "signature", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], GameRecord.prototype, "points", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], GameRecord.prototype, "nonce", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: GameRecordStatus, default: GameRecordStatus.UNUSED }),
    __metadata("design:type", String)
], GameRecord.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], GameRecord.prototype, "apiResponse", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], GameRecord.prototype, "createdAt", void 0);
exports.GameRecord = GameRecord = __decorate([
    (0, mongoose_1.Schema)()
], GameRecord);
exports.GameRecordSchema = mongoose_1.SchemaFactory.createForClass(GameRecord);
exports.GameRecordSchema.index({ accountId: 1, recordId: 1 }, { unique: true, sparse: true });
exports.GameRecordSchema.index({ accountId: 1, gameLabel: 1, nonce: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=game-record.schema.js.map