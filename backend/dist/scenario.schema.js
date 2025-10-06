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
exports.ScenarioSchema = exports.Scenario = exports.Action = exports.ActionType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var ActionType;
(function (ActionType) {
    ActionType["GET_FEED"] = "GetFeed";
    ActionType["LIKE_CAST"] = "LikeCast";
    ActionType["RECAST_CAST"] = "RecastCast";
    ActionType["PIN_MINI_APP"] = "PinMiniApp";
    ActionType["DELAY"] = "Delay";
    ActionType["JOIN_CHANNEL"] = "JoinChannel";
    ActionType["FOLLOW_USER"] = "FollowUser";
    ActionType["UPDATE_WALLET"] = "UpdateWallet";
    ActionType["CREATE_RECORD_GAME"] = "CreateRecordGame";
    ActionType["MINI_APP_EVENT"] = "MiniAppEvent";
    ActionType["ANALYTICS_EVENTS"] = "AnalyticsEvents";
})(ActionType || (exports.ActionType = ActionType = {}));
let Action = class Action {
    type;
    config;
    order;
};
exports.Action = Action;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ActionType }),
    __metadata("design:type", String)
], Action.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Action.prototype, "config", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Action.prototype, "order", void 0);
exports.Action = Action = __decorate([
    (0, mongoose_1.Schema)()
], Action);
const ActionSchema = mongoose_1.SchemaFactory.createForClass(Action);
let Scenario = class Scenario {
    name;
    actions;
    shuffle;
    loop;
    createdAt;
    updatedAt;
};
exports.Scenario = Scenario;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Scenario.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ActionSchema] }),
    __metadata("design:type", Array)
], Scenario.prototype, "actions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Scenario.prototype, "shuffle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Scenario.prototype, "loop", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Scenario.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Scenario.prototype, "updatedAt", void 0);
exports.Scenario = Scenario = __decorate([
    (0, mongoose_1.Schema)()
], Scenario);
exports.ScenarioSchema = mongoose_1.SchemaFactory.createForClass(Scenario);
//# sourceMappingURL=scenario.schema.js.map