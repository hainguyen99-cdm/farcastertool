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
exports.LogSchema = exports.Log = exports.LogStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const scenario_schema_1 = require("./scenario.schema");
var LogStatus;
(function (LogStatus) {
    LogStatus["SUCCESS"] = "Success";
    LogStatus["FAILURE"] = "Failure";
})(LogStatus || (exports.LogStatus = LogStatus = {}));
let Log = class Log {
    accountId;
    scenarioId;
    actionType;
    status;
    error;
    result;
    timestamp;
};
exports.Log = Log;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Account', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Log.prototype, "accountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Scenario', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Log.prototype, "scenarioId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: scenario_schema_1.ActionType }),
    __metadata("design:type", String)
], Log.prototype, "actionType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: LogStatus, required: true }),
    __metadata("design:type", String)
], Log.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Log.prototype, "error", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Log.prototype, "result", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Log.prototype, "timestamp", void 0);
exports.Log = Log = __decorate([
    (0, mongoose_1.Schema)()
], Log);
exports.LogSchema = mongoose_1.SchemaFactory.createForClass(Log);
//# sourceMappingURL=log.schema.js.map