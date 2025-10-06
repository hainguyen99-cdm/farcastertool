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
exports.AccountSchema = exports.Account = exports.PrivyToken = exports.AccountStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "Active";
    AccountStatus["EXPIRED"] = "Expired";
    AccountStatus["ERROR"] = "Error";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
let PrivyToken = class PrivyToken {
    gameLabel;
    encryptedPrivyToken;
};
exports.PrivyToken = PrivyToken;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PrivyToken.prototype, "gameLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PrivyToken.prototype, "encryptedPrivyToken", void 0);
exports.PrivyToken = PrivyToken = __decorate([
    (0, mongoose_1.Schema)({ _id: true })
], PrivyToken);
const PrivyTokenSchema = mongoose_1.SchemaFactory.createForClass(PrivyToken);
let Account = class Account {
    name;
    encryptedToken;
    status;
    lastUsed;
    error;
    walletAddress;
    username;
    fid;
    privyTokens;
};
exports.Account = Account;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Account.prototype, "encryptedToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: AccountStatus, default: AccountStatus.ACTIVE }),
    __metadata("design:type", String)
], Account.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Account.prototype, "lastUsed", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Account.prototype, "error", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Account.prototype, "walletAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Account.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Account.prototype, "fid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [PrivyTokenSchema], default: [] }),
    __metadata("design:type", Array)
], Account.prototype, "privyTokens", void 0);
exports.Account = Account = __decorate([
    (0, mongoose_1.Schema)()
], Account);
exports.AccountSchema = mongoose_1.SchemaFactory.createForClass(Account);
//# sourceMappingURL=account.schema.js.map