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
exports.ScriptSchema = exports.Script = exports.ScriptAction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const scenario_schema_1 = require("./scenario.schema");
let ScriptAction = class ScriptAction {
    type;
    config;
    order;
};
exports.ScriptAction = ScriptAction;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: scenario_schema_1.ActionType }),
    __metadata("design:type", String)
], ScriptAction.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], ScriptAction.prototype, "config", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ScriptAction.prototype, "order", void 0);
exports.ScriptAction = ScriptAction = __decorate([
    (0, mongoose_1.Schema)()
], ScriptAction);
const ScriptActionSchema = mongoose_1.SchemaFactory.createForClass(ScriptAction);
let Script = class Script {
    name;
    actions;
    shuffle;
    loop;
    createdAt;
    updatedAt;
};
exports.Script = Script;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Script.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ScriptActionSchema] }),
    __metadata("design:type", Array)
], Script.prototype, "actions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Script.prototype, "shuffle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Script.prototype, "loop", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Script.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Script.prototype, "updatedAt", void 0);
exports.Script = Script = __decorate([
    (0, mongoose_1.Schema)()
], Script);
exports.ScriptSchema = mongoose_1.SchemaFactory.createForClass(Script);
//# sourceMappingURL=script.schema.js.map