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
const account_service_1 = require("./account.service");
const signature_header_service_1 = require("./signature-header.service");
const game_record_service_1 = require("./game-record.service");
const ethers_1 = require("ethers");
let ActionProcessor = class ActionProcessor {
    farcasterService;
    loggingService;
    accountService;
    signatureHeaderService;
    gameRecordService;
    constructor(farcasterService, loggingService, accountService, signatureHeaderService, gameRecordService) {
        this.farcasterService = farcasterService;
        this.loggingService = loggingService;
        this.accountService = accountService;
        this.signatureHeaderService = signatureHeaderService;
        this.gameRecordService = gameRecordService;
    }
    async processAction(job) {
        const { accountId, scenarioId, action, encryptedToken, previousResults } = job.data;
        try {
            let result;
            switch (action.type) {
                case scenario_schema_1.ActionType.GET_FEED:
                case 'GetFeed': {
                    result = await this.farcasterService.getFeed(encryptedToken);
                    break;
                }
                case scenario_schema_1.ActionType.LIKE_CAST:
                case 'LikeCast': {
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
                case scenario_schema_1.ActionType.RECAST_CAST:
                case 'RecastCast': {
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
                case scenario_schema_1.ActionType.DELAY:
                case 'Delay': {
                    const delayMs = typeof action.config['delayMs'] === 'number' ? action.config['delayMs'] : 5000;
                    await this.sleep(delayMs);
                    result = { success: true, delayMs };
                    break;
                }
                case scenario_schema_1.ActionType.JOIN_CHANNEL:
                case 'JoinChannel': {
                    const channelKey = action.config['channelKey'];
                    const inviteCode = action.config['inviteCode'];
                    if (!channelKey || !inviteCode) {
                        throw new Error('Missing channelKey or inviteCode for JOIN_CHANNEL action');
                    }
                    result = await this.farcasterService.joinChannel(encryptedToken, channelKey, inviteCode);
                    break;
                }
                case scenario_schema_1.ActionType.PIN_MINI_APP:
                case 'PinMiniApp': {
                    const domain = action.config['domain'];
                    if (!domain) {
                        throw new Error('Missing domain for PIN_MINI_APP action');
                    }
                    result = await this.farcasterService.pinMiniApp(encryptedToken, domain);
                    break;
                }
                case scenario_schema_1.ActionType.FOLLOW_USER:
                case 'FollowUser': {
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
                case scenario_schema_1.ActionType.UPDATE_WALLET:
                case 'UpdateWallet': {
                    const updatedAccount = await this.accountService.updateWalletAndUsername(accountId);
                    result = {
                        success: true,
                        walletAddress: updatedAccount.walletAddress,
                        username: updatedAccount.username,
                        fid: updatedAccount.fid,
                    };
                    break;
                }
                case scenario_schema_1.ActionType.CREATE_WALLET:
                case 'CreateWallet': {
                    const secretPhrase = action.config['secretPhrase'];
                    if (!secretPhrase) {
                        throw new Error('Missing secretPhrase for CREATE_WALLET action');
                    }
                    const wallet = ethers_1.ethers.Wallet.fromPhrase(secretPhrase);
                    const walletAddress = wallet.address;
                    const privateKey = wallet.privateKey;
                    const updatedAccount = await this.accountService.updateWalletAddress(accountId, walletAddress);
                    result = {
                        success: true,
                        walletAddress,
                        privateKey,
                        message: 'Wallet created and saved successfully',
                    };
                    break;
                }
                case scenario_schema_1.ActionType.CREATE_RECORD_GAME:
                case 'CreateRecordGame': {
                    const gameLabel = action.config['gameLabel'];
                    if (!gameLabel) {
                        throw new Error('Missing gameLabel for CREATE_RECORD_GAME action');
                    }
                    const readiness = await this.accountService.checkCreateRecordGameReadiness(accountId, gameLabel);
                    if (!readiness.ready) {
                        throw new Error(`Account not ready for CREATE_RECORD_GAME: ${readiness.issues.join(', ')}`);
                    }
                    const account = await this.accountService.findOne(accountId);
                    const wallet = account.walletAddress;
                    const privyToken = await this.accountService.getDecryptedPrivyToken(accountId, gameLabel);
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
                            'Authorization': `Bearer ${privyToken}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 20000,
                    });
                    const responseData = response.data;
                    console.log('CREATE_RECORD_GAME API Response:', JSON.stringify(responseData, null, 2));
                    let records = [];
                    if (responseData?.data && Array.isArray(responseData.data)) {
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
                        throw new Error('No records found in API response');
                    }
                    const recordIds = records.map(r => r.recordId).filter(Boolean);
                    const uniqueRecordIds = new Set(recordIds);
                    console.log(`Record statistics:`, {
                        totalRecords: records.length,
                        recordsWithId: recordIds.length,
                        uniqueRecordIds: uniqueRecordIds.size,
                        duplicateRecordIds: recordIds.length - uniqueRecordIds.size
                    });
                    console.log(`API returned ${records.length} unique records (no duplicates in API response)`);
                    const gameRecordInputs = records.map(record => ({
                        accountId,
                        gameLabel,
                        apiResponse: record,
                    }));
                    for (const record of records) {
                        await this.loggingService.createLog({
                            accountId: new mongoose_1.Types.ObjectId(accountId),
                            scenarioId: new mongoose_1.Types.ObjectId(scenarioId),
                            actionType: action.type,
                            status: log_schema_1.LogStatus.UNUSED,
                            result: record,
                        });
                    }
                    try {
                        const savedRecords = await this.gameRecordService.createUnusedBulk(gameRecordInputs);
                        console.log(`Successfully saved ${savedRecords.length} game records`);
                    }
                    catch (dbError) {
                        console.error('Bulk save failed, trying individual saves:', dbError);
                        let successCount = 0;
                        let skipCount = 0;
                        for (const input of gameRecordInputs) {
                            try {
                                const exists = await this.gameRecordService.recordExists(input.accountId, input.gameLabel, input.apiResponse);
                                if (exists) {
                                    const pieces = this.gameRecordService['extractFields'](input.apiResponse);
                                    console.log(`Skipping existing recordId: ${pieces.recordId || 'no-recordId'}`);
                                    skipCount++;
                                    continue;
                                }
                                await this.gameRecordService.createUnused(input);
                                successCount++;
                                console.log(`Individual record saved successfully (${successCount}/${gameRecordInputs.length})`);
                            }
                            catch (individualError) {
                                if (individualError.message?.includes('duplicate key')) {
                                    console.log('Skipping duplicate record:', individualError.message);
                                    skipCount++;
                                }
                                else {
                                    console.error('Failed to save individual record:', individualError);
                                }
                            }
                        }
                        console.log(`Individual save completed: ${successCount} records saved, ${skipCount} skipped (duplicates)`);
                    }
                    result = records;
                    return { ...(previousResults || {}), [action.type]: records };
                }
                case scenario_schema_1.ActionType.MINI_APP_EVENT:
                case 'MiniAppEvent': {
                    const domain = action.config['domain'];
                    const event = action.config['event'];
                    const platformType = action.config['platformType'];
                    if (!domain || !event) {
                        throw new Error('Missing domain or event for MINI_APP_EVENT action');
                    }
                    result = await this.farcasterService.sendMiniAppEvent(encryptedToken, domain, event, platformType || 'web');
                    break;
                }
                case scenario_schema_1.ActionType.ANALYTICS_EVENTS:
                case 'AnalyticsEvents': {
                    const frameDomain = action.config['frameDomain'];
                    const frameName = action.config['frameName'];
                    const frameUrl = action.config['frameUrl'];
                    if (!frameDomain || !frameName || !frameUrl) {
                        throw new Error('Missing frameDomain, frameName, or frameUrl for ANALYTICS_EVENTS action');
                    }
                    const account = await this.accountService.findOne(accountId);
                    if (!account.fid) {
                        throw new Error('Account FID not found. Please run UpdateWallet action first to get account FID.');
                    }
                    const events = [{
                            type: 'frame-launch',
                            data: {
                                frameDomain,
                                frameUrl,
                                frameName,
                                authorFid: account.fid
                            },
                            ts: Date.now()
                        }];
                    result = await this.farcasterService.sendAnalyticsEvents(encryptedToken, events);
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
        logging_service_1.LoggingService,
        account_service_1.AccountService,
        signature_header_service_1.SignatureHeaderService,
        game_record_service_1.GameRecordService])
], ActionProcessor);
//# sourceMappingURL=action.processor.js.map