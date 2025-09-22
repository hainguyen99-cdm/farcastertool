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
exports.ScenarioService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const scenario_schema_1 = require("./scenario.schema");
let ScenarioService = class ScenarioService {
    scenarioModel;
    constructor(scenarioModel) {
        this.scenarioModel = scenarioModel;
    }
    async createScenario(input) {
        if (input.actions && input.actions.length > 0) {
            this.validateActions(input.actions);
        }
        const created = new this.scenarioModel({ ...input });
        return await created.save();
    }
    async getScenarios() {
        return await this.scenarioModel.find().sort({ createdAt: -1 }).lean();
    }
    async getScenarioById(id) {
        const isValid = mongoose_2.Types.ObjectId.isValid(id);
        if (!isValid) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        const scenario = await this.scenarioModel.findById(id).lean();
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        return scenario;
    }
    async updateScenario(id, input) {
        const isValid = mongoose_2.Types.ObjectId.isValid(id);
        if (!isValid) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (input.actions && input.actions.length > 0) {
            this.validateActions(input.actions);
        }
        const updated = await this.scenarioModel
            .findByIdAndUpdate(id, { ...input, updatedAt: new Date() }, { new: true, runValidators: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        return updated;
    }
    async deleteScenario(id) {
        const isValid = mongoose_2.Types.ObjectId.isValid(id);
        if (!isValid) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        const res = await this.scenarioModel.findByIdAndDelete(id);
        if (!res) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        return { deleted: true };
    }
    validateActions(actions) {
        const errors = [];
        actions.forEach((action, index) => {
            if (!action || typeof action !== 'object') {
                errors.push(`Action at index ${index} must be an object.`);
                return;
            }
            if (!Object.values(scenario_schema_1.ActionType).includes(action.type)) {
                errors.push(`Action at index ${index} has invalid type.`);
                return;
            }
            if (action.order !== undefined && (typeof action.order !== 'number' || Number.isNaN(action.order))) {
                errors.push(`Action at index ${index} has invalid order. It must be a number.`);
            }
            switch (action.type) {
                case scenario_schema_1.ActionType.DELAY: {
                    const config = action.config;
                    const durationMs = config && config['durationMs'];
                    if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs <= 0) {
                        errors.push(`Action at index ${index} (Delay) requires a numeric 'durationMs' > 0.`);
                    }
                    break;
                }
                case scenario_schema_1.ActionType.JOIN_CHANNEL: {
                    const config = action.config;
                    const channelKey = config && config['channelKey'];
                    const inviteCode = config && config['inviteCode'];
                    if (!channelKey || typeof channelKey !== 'string') {
                        errors.push(`Action at index ${index} (JoinChannel) requires 'channelKey' (string).`);
                    }
                    if (!inviteCode || typeof inviteCode !== 'string') {
                        errors.push(`Action at index ${index} (JoinChannel) requires 'inviteCode' (string).`);
                    }
                    break;
                }
                case scenario_schema_1.ActionType.GET_FEED: {
                    const config = action.config;
                    if (config) {
                        if ('feedKey' in config && typeof config['feedKey'] !== 'string') {
                            errors.push(`Action at index ${index} (GetFeed) optional 'feedKey' must be a string.`);
                        }
                        if ('feedType' in config && typeof config['feedType'] !== 'string') {
                            errors.push(`Action at index ${index} (GetFeed) optional 'feedType' must be a string.`);
                        }
                    }
                    break;
                }
                case scenario_schema_1.ActionType.LIKE_CAST: {
                    const config = action.config;
                    const likeMethod = config && config['likeMethod'];
                    if (likeMethod === 'url') {
                        const castUrl = config && config['castUrl'];
                        if (!castUrl || typeof castUrl !== 'string') {
                            errors.push(`Action at index ${index} (LikeCast) with URL method requires 'castUrl' (string).`);
                        }
                        else {
                            try {
                                const url = new URL(castUrl);
                                if (url.hostname !== 'farcaster.xyz' && url.hostname !== 'warpcast.com') {
                                    errors.push(`Action at index ${index} (LikeCast) castUrl must be a valid Farcaster URL (farcaster.xyz or warpcast.com).`);
                                }
                                const pathParts = url.pathname.split('/');
                                if (pathParts.length < 3 || !pathParts[2].startsWith('0x')) {
                                    errors.push(`Action at index ${index} (LikeCast) castUrl must be in format: https://farcaster.xyz/username/0x...`);
                                }
                            }
                            catch {
                                errors.push(`Action at index ${index} (LikeCast) castUrl must be a valid URL.`);
                            }
                        }
                    }
                    else if (likeMethod && likeMethod !== 'random') {
                        errors.push(`Action at index ${index} (LikeCast) has invalid likeMethod. Must be 'random' or 'url'.`);
                    }
                    break;
                }
                default: {
                    errors.push(`Action at index ${index} has unsupported type.`);
                }
            }
        });
        if (errors.length > 0) {
            throw new common_1.BadRequestException({ message: 'Invalid actions', errors });
        }
    }
    async reorderActionsByIds(scenarioId, orderedActionIds) {
        const isValid = mongoose_2.Types.ObjectId.isValid(scenarioId);
        if (!isValid) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (!Array.isArray(orderedActionIds) || orderedActionIds.length === 0) {
            throw new common_1.BadRequestException('orderedActionIds must be a non-empty array');
        }
        const scenario = await this.scenarioModel.findById(scenarioId);
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        const idToAction = new Map();
        (scenario.actions || []).forEach(a => {
            const key = String(a._id);
            idToAction.set(key, a);
        });
        const reordered = [];
        orderedActionIds.forEach((id, index) => {
            const act = idToAction.get(String(id));
            if (!act) {
                return;
            }
            act.order = index;
            reordered.push(act);
            idToAction.delete(String(id));
        });
        Array.from(idToAction.values()).forEach((act, idx) => {
            act.order = reordered.length + idx;
            reordered.push(act);
        });
        scenario.actions = reordered;
        scenario.updatedAt = new Date();
        await scenario.save();
        return (await this.scenarioModel.findById(scenarioId).lean());
    }
    async moveActionToIndex(scenarioId, actionId, toIndex) {
        const isValid = mongoose_2.Types.ObjectId.isValid(scenarioId);
        if (!isValid) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (typeof toIndex !== 'number' || !Number.isFinite(toIndex) || toIndex < 0) {
            throw new common_1.BadRequestException('toIndex must be a non-negative number');
        }
        const scenario = await this.scenarioModel.findById(scenarioId);
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        const actions = (scenario.actions || []);
        const currentIndex = actions.findIndex(a => String(a._id) === String(actionId));
        if (currentIndex === -1) {
            throw new common_1.NotFoundException('Action not found in scenario');
        }
        const boundedIndex = Math.min(Math.max(0, Math.trunc(toIndex)), Math.max(0, actions.length - 1));
        const [moved] = actions.splice(currentIndex, 1);
        actions.splice(boundedIndex, 0, moved);
        actions.forEach((a, idx) => {
            a.order = idx;
        });
        scenario.actions = actions;
        scenario.updatedAt = new Date();
        await scenario.save();
        return (await this.scenarioModel.findById(scenarioId).lean());
    }
    async normalizeActionOrders(scenarioId) {
        const isValid = mongoose_2.Types.ObjectId.isValid(scenarioId);
        if (!isValid) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        const scenario = await this.scenarioModel.findById(scenarioId);
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        const actions = (scenario.actions || []);
        actions
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .forEach((a, idx) => {
            a.order = idx;
        });
        scenario.actions = actions;
        scenario.updatedAt = new Date();
        await scenario.save();
        return (await this.scenarioModel.findById(scenarioId).lean());
    }
};
exports.ScenarioService = ScenarioService;
exports.ScenarioService = ScenarioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(scenario_schema_1.Scenario.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ScenarioService);
//# sourceMappingURL=scenario.service.js.map