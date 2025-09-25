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
exports.ActionProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const farcaster_service_1 = require("./farcaster.service");
const logging_service_1 = require("./logging.service");
const scenario_schema_1 = require("./scenario.schema");
const log_schema_1 = require("./log.schema");
let ActionProcessor = class ActionProcessor {
    farcasterService;
    loggingService;
    constructor(farcasterService, loggingService) {
        this.farcasterService = farcasterService;
        this.loggingService = loggingService;
    }
    async processAction(job) {
        const { accountId, scenarioId, action, encryptedToken, previousResults } = job.data;
        try {
            let result;
            switch (action.type) {
                case scenario_schema_1.ActionType.GET_FEED: {
                    result = await this.farcasterService.getFeed(encryptedToken);
                    break;
                }
                case scenario_schema_1.ActionType.LIKE_CAST: {
                    const likeMethod = action.config['likeMethod'];
                    let castHash = null;
                    if (likeMethod === 'url') {
                        const castUrl = action.config['castUrl'];
                        if (!castUrl) {
                            throw new Error('Missing castUrl for LIKE_CAST action with URL method');
                        }
                        castHash = await this.farcasterService.getFirstCastHashFromThread(encryptedToken, castUrl);
                        if (!castHash) {
                            throw new Error(`No casts found in thread for URL: ${castUrl}`);
                        }
                    }
                    else {
                        const prior = previousResults || {};
                        const castHashFromFeed = this.farcasterService.getRandomCastHashFromFeed(prior[scenario_schema_1.ActionType.GET_FEED]);
                        castHash = castHashFromFeed || action.config['castHash'];
                        if (!castHash) {
                            throw new Error('Missing castHash for LIKE_CAST action - no feed data available and no fallback provided');
                        }
                    }
                    result = await this.farcasterService.likeCast(encryptedToken, castHash);
                    break;
                }
                case scenario_schema_1.ActionType.RECAST_CAST: {
                    const recastMethod = action.config['likeMethod'];
                    let castHash = null;
                    if (recastMethod === 'url') {
                        const castUrl = action.config['castUrl'];
                        if (!castUrl) {
                            throw new Error('Missing castUrl for RECAST_CAST action with URL method');
                        }
                        castHash = await this.farcasterService.getFirstCastHashFromThread(encryptedToken, castUrl);
                        if (!castHash) {
                            throw new Error(`No casts found in thread for URL: ${castUrl}`);
                        }
                    }
                    else {
                        const prior = previousResults || {};
                        const castHashFromFeed = this.farcasterService.getRandomCastHashFromFeed(prior[scenario_schema_1.ActionType.GET_FEED]);
                        castHash = castHashFromFeed || action.config['castHash'];
                        if (!castHash) {
                            throw new Error('Missing castHash for RECAST_CAST action - no feed data available and no fallback provided');
                        }
                    }
                    result = await this.farcasterService.recastCast(encryptedToken, castHash);
                    break;
                }
                case scenario_schema_1.ActionType.DELAY: {
                    const delayMs = typeof action.config['delayMs'] === 'number' ? action.config['delayMs'] : 5000;
                    await this.sleep(delayMs);
                    result = { success: true, delayMs };
                    break;
                }
                case scenario_schema_1.ActionType.JOIN_CHANNEL: {
                    const channelKey = action.config['channelKey'];
                    const inviteCode = action.config['inviteCode'];
                    if (!channelKey || !inviteCode) {
                        throw new Error('Missing channelKey or inviteCode for JOIN_CHANNEL action');
                    }
                    result = await this.farcasterService.joinChannel(encryptedToken, channelKey, inviteCode);
                    break;
                }
                case scenario_schema_1.ActionType.PIN_MINI_APP: {
                    const domain = action.config['domain'];
                    if (!domain) {
                        throw new Error('Missing domain for PIN_MINI_APP action');
                    }
                    result = await this.farcasterService.pinMiniApp(encryptedToken, domain);
                    break;
                }
                case scenario_schema_1.ActionType.FOLLOW_USER: {
                    const userLink = action.config['userLink'];
                    if (!userLink) {
                        throw new Error('Missing userLink for FOLLOW_USER action');
                    }
                    const urlMatch = userLink.match(/farcaster\.xyz\/([^\/\?]+)/);
                    if (!urlMatch) {
                        throw new Error('Invalid Farcaster user URL format');
                    }
                    const username = urlMatch[1];
                    const userInfo = await this.farcasterService.getUserByUsername(encryptedToken, username);
                    const userData = userInfo;
                    const targetFid = userData?.result?.user?.fid;
                    if (!targetFid) {
                        throw new Error(`Could not find user FID for username: ${username}`);
                    }
                    result = await this.farcasterService.followUser(encryptedToken, targetFid);
                    break;
                }
                default: {
                    const neverType = action.type;
                    throw new Error(`Unknown action type: ${String(neverType)}`);
                }
            }
            await this.loggingService.createLog({
                accountId: new mongoose_1.Types.ObjectId(accountId),
                scenarioId: new mongoose_1.Types.ObjectId(scenarioId),
                actionType: action.type,
                status: log_schema_1.LogStatus.SUCCESS,
                result: result || {},
            });
            return { ...(previousResults || {}), [action.type]: result };
        }
        catch (err) {
            await this.loggingService.createLog({
                accountId: new mongoose_1.Types.ObjectId(accountId),
                scenarioId: new mongoose_1.Types.ObjectId(scenarioId),
                actionType: action.type,
                status: log_schema_1.LogStatus.FAILURE,
                error: err.message,
            });
            throw err;
        }
    }
    async sleep(ms) {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.ActionProcessor = ActionProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActionProcessor.prototype, "processAction", null);
exports.ActionProcessor = ActionProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('actions'),
    __metadata("design:paramtypes", [farcaster_service_1.FarcasterService,
        logging_service_1.LoggingService])
], ActionProcessor);
//# sourceMappingURL=action.processor.js.map