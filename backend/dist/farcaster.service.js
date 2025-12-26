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
var FarcasterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarcasterService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const encryption_service_1 = require("./encryption.service");
const form_data_1 = require("form-data");
const path = require("path");
const crypto = require("crypto");
function cryptoRandomId(bytes = 16) {
    return crypto.randomBytes(bytes).toString('hex');
}
let FarcasterService = class FarcasterService {
    static { FarcasterService_1 = this; }
    httpService;
    encryptionService;
    baseUrl = 'https://client.farcaster.xyz';
    static MAX_RETRY_ATTEMPTS = 3;
    static INITIAL_BACKOFF_MS = 300;
    static RATE_LIMIT_WINDOW_MS = 1000;
    static RATE_LIMIT_MAX_REQUESTS = 5;
    rateLimitStore = new Map();
    imageDeliveryAccount = 'BXluQx4ige9GuW0Ia56BHw';
    constructor(httpService, encryptionService) {
        this.httpService = httpService;
        this.encryptionService = encryptionService;
    }
    buildAuthHeaders(token) {
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    getRandomCastHashFromFeed(feedResponse) {
        const hashes = this.extractCastHashes(feedResponse);
        if (hashes.length === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * hashes.length);
        return hashes[index] ?? null;
    }
    extractCastHashFromUrl(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname !== 'farcaster.xyz' && urlObj.hostname !== 'warpcast.com') {
                return null;
            }
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.length < 3) {
                return null;
            }
            const castHash = pathParts[2];
            if (castHash.startsWith('0x') && castHash.length > 2) {
                return castHash;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async getFirstCastHashFromThread(encryptedToken, url) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`getThreadCasts:${encryptedToken}`);
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname !== 'farcaster.xyz' && urlObj.hostname !== 'warpcast.com') {
                throw new Error('Invalid URL hostname');
            }
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.length < 3) {
                throw new Error('Invalid URL format');
            }
            const username = pathParts[1];
            const castHashPrefix = pathParts[2];
            if (!username || !castHashPrefix.startsWith('0x')) {
                throw new Error('Invalid username or cast hash prefix');
            }
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/v2/user-thread-casts`, {
                params: {
                    castHashPrefix: castHashPrefix,
                    username: username,
                    limit: 15
                },
                headers: this.buildAuthHeaders(token),
            })));
            const data = response.data;
            const casts = data?.result?.casts;
            if (!Array.isArray(casts) || casts.length === 0) {
                return null;
            }
            const firstCast = casts[0];
            return firstCast?.hash || null;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to fetch thread casts', this.resolveStatus(err));
        }
    }
    extractCastHashes(feedResponse) {
        const items = this.findFeedItems(feedResponse);
        return items
            .map((item) => this.findCastHashOnItem(item))
            .filter((hash) => Boolean(hash));
    }
    findFeedItems(feedResponse) {
        if (!feedResponse || typeof feedResponse !== 'object') {
            return [];
        }
        const root = feedResponse;
        const candidates = [];
        const directItems = root.items;
        if (Array.isArray(directItems)) {
            candidates.push(...directItems);
        }
        const data = root.data;
        if (data) {
            const dataItems = data.items;
            if (Array.isArray(dataItems)) {
                candidates.push(...dataItems);
            }
            const feedItems = data.feedItems;
            if (Array.isArray(feedItems)) {
                candidates.push(...feedItems);
            }
        }
        const feedItems = root.feedItems;
        if (Array.isArray(feedItems)) {
            candidates.push(...feedItems);
        }
        return candidates;
    }
    findCastHashOnItem(item) {
        if (!item || typeof item !== 'object') {
            return null;
        }
        const obj = item;
        const cast = (obj.cast || obj['castItem'] || obj['fidCast']);
        if (cast && typeof cast === 'object') {
            const hash = (cast.hash || cast.castHash || cast['merkleRoot']);
            if (typeof hash === 'string' && hash.length > 0) {
                return hash;
            }
        }
        const directHash = (obj.hash || obj.castHash);
        if (typeof directHash === 'string' && directHash.length > 0) {
            return directHash;
        }
        return null;
    }
    async getFeed(encryptedToken) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`getFeed:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/v2/feed-items`, {
                feedKey: 'home',
                feedType: 'default',
                castViewEvents: [],
                updateState: true,
            }, { headers: this.buildAuthHeaders(token) })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to fetch feed', this.resolveStatus(err));
        }
    }
    async likeCast(encryptedToken, castHash) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`likeCast:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.baseUrl}/v2/cast-likes`, { castHash }, { headers: this.buildAuthHeaders(token) })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to like cast', this.resolveStatus(err));
        }
    }
    async recastCast(encryptedToken, castHash) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`recastCast:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.baseUrl}/v2/recasts`, { castHash }, { headers: this.buildAuthHeaders(token) })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to recast', this.resolveStatus(err));
        }
    }
    async joinChannel(encryptedToken, channelKey, inviteCode) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`joinChannel:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.baseUrl}/v1/join-channel-via-code`, { channelKey, inviteCode }, { headers: this.buildAuthHeaders(token) })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to join channel', this.resolveStatus(err));
        }
    }
    async pinMiniApp(encryptedToken, domain) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`pinMiniApp:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.baseUrl}/v1/favorite-frames`, { domain }, { headers: this.buildAuthHeaders(token) })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to pin miniapp', this.resolveStatus(err));
        }
    }
    async getUserByUsername(encryptedToken, username) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`getUserByUsername:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/v2/user-by-username?username=${encodeURIComponent(username)}`, { headers: this.buildAuthHeaders(token) })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to get user by username', this.resolveStatus(err));
        }
    }
    async followUser(encryptedToken, targetFid) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`followUser:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.baseUrl}/v2/follows`, { targetFid }, { headers: this.buildAuthHeaders(token) })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to follow user', this.resolveStatus(err));
        }
    }
    async getOnboardingState(encryptedToken) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`getOnboardingState:${encryptedToken}`);
        try {
            const onboardingResponse = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.get('https://client.warpcast.com/v2/onboarding-state', {
                headers: {
                    ...this.buildAuthHeaders(token),
                    'accept': '*/*',
                    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'origin': 'https://wallet.farcaster.xyz',
                    'referer': 'https://wallet.farcaster.xyz/',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                },
            })));
            console.log('onboardingResponse', onboardingResponse.data);
            const onboardingData = onboardingResponse.data;
            const state = onboardingData?.result?.state;
            if (!state) {
                throw new Error('Invalid onboarding state response');
            }
            const username = state.user?.username;
            const fid = state.user?.fid;
            if (!username || !fid) {
                throw new Error('Missing username or FID in onboarding state response');
            }
            const userResponse = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://client.farcaster.xyz/v2/user?fid=${fid}`, {
                headers: {
                    ...this.buildAuthHeaders(token),
                    'accept': '*/*',
                    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'origin': 'https://farcaster.xyz',
                    'referer': 'https://farcaster.xyz/',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                },
            })));
            console.log('userResponse', userResponse.data);
            const userData = userResponse.data;
            const user = userData?.result?.user;
            const extras = userData?.result?.extras;
            if (!user || !extras) {
                throw new Error('Invalid user details response');
            }
            const ethWallets = extras.ethWallets;
            if (!ethWallets || !Array.isArray(ethWallets) || ethWallets.length === 0) {
                throw new Error('No ETH wallets found in user details');
            }
            const walletAddress = ethWallets[0];
            if (!walletAddress) {
                throw new Error('Missing wallet address in user details');
            }
            return { walletAddress, username, fid };
        }
        catch (err) {
            throw new common_1.HttpException('Failed to get onboarding state', this.resolveStatus(err));
        }
    }
    async generateImageUploadUrl(encryptedToken) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`generateImageUploadUrl:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/v1/generate-image-upload-url`, {}, {
                headers: {
                    ...this.buildAuthHeaders(token),
                    'idempotency-key': cryptoRandomId(),
                    'accept': '*/*',
                    'origin': 'https://farcaster.xyz',
                    'referer': 'https://farcaster.xyz/',
                },
            })));
            const data = response.data;
            return { url: data?.url, optimisticImageId: data?.optimisticImageId };
        }
        catch (err) {
            throw new common_1.HttpException('Failed to generate image upload url', this.resolveStatus(err));
        }
    }
    async uploadImageToUrl(uploadUrl, file, filename, contentType = 'image/jpeg') {
        try {
            const form = new form_data_1.default();
            form.append('file', file, { filename, contentType });
            const headers = {
                ...form.getHeaders(),
                accept: '*/*',
                origin: 'https://farcaster.xyz',
                referer: 'https://farcaster.xyz/',
            };
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.post(uploadUrl, form, { headers })));
            const data = response.data;
            return { id: data?.result?.id, variants: data?.result?.variants || [] };
        }
        catch (err) {
            throw new common_1.HttpException('Failed to upload image', this.resolveStatus(err));
        }
    }
    async fetchImageFromUrl(imageUrl) {
        try {
            const res = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.get(imageUrl, { responseType: 'arraybuffer' })));
            const contentType = res.headers['content-type'] || 'application/octet-stream';
            const buffer = Buffer.from(res.data);
            const urlObj = new URL(imageUrl);
            const base = path.basename(urlObj.pathname) || 'image';
            const filename = base.includes('.') ? base : `${base}.${contentType.split('/')[1] || 'jpg'}`;
            return { buffer, filename, contentType };
        }
        catch (err) {
            throw new common_1.HttpException('Failed to download image', this.resolveStatus(err));
        }
    }
    async createCast(encryptedToken, text, embeds = []) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`createCast:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/v2/casts`, { text, embeds }, {
                headers: {
                    ...this.buildAuthHeaders(token),
                    'idempotency-key': cryptoRandomId(),
                    accept: '*/*',
                    origin: 'https://farcaster.xyz',
                    referer: 'https://farcaster.xyz/',
                },
            })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to create cast', this.resolveStatus(err));
        }
    }
    async sendMiniAppEvent(encryptedToken, domain, event, platformType = 'web') {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`sendMiniAppEvent:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.put(`${this.baseUrl}/v2/mini-app-event`, {
                domain,
                event,
                platformType,
            }, {
                headers: {
                    ...this.buildAuthHeaders(token),
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    'fc-amplitude-device-id': '3jnphWn_51bkN0PY4XbYWq',
                    'fc-amplitude-session-id': '1759718576589',
                    'idempotency-key': '59b0d3e0-4278-0edd-0c61-d888452c14a7',
                    'origin': 'https://farcaster.xyz',
                    'priority': 'u=1, i',
                    'referer': 'https://farcaster.xyz/',
                    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
                },
            })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to send mini app event', this.resolveStatus(err));
        }
    }
    async sendAnalyticsEvents(encryptedToken, events) {
        const token = this.encryptionService.decrypt(encryptedToken);
        this.enforceRateLimit(`sendAnalyticsEvents:${encryptedToken}`);
        try {
            const response = await this.executeWithRetry(async () => (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/v1/analytics-events`, { events }, {
                headers: {
                    ...this.buildAuthHeaders(token),
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    'fc-amplitude-device-id': '3jnphWn_51bkN0PY4XbYWq',
                    'fc-amplitude-session-id': '1759718576589',
                    'idempotency-key': 'be0fd598-346b-31b0-59fd-a196e50defda',
                    'origin': 'https://farcaster.xyz',
                    'priority': 'u=1, i',
                    'referer': 'https://farcaster.xyz/',
                    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
                },
            })));
            return response.data;
        }
        catch (err) {
            throw new common_1.HttpException('Failed to send analytics events', this.resolveStatus(err));
        }
    }
    async executeWithRetry(operation) {
        let attempt = 0;
        let backoffMs = FarcasterService_1.INITIAL_BACKOFF_MS;
        for (;;) {
            try {
                return await operation();
            }
            catch (err) {
                attempt += 1;
                const shouldRetry = this.isRetryableError(err) && attempt < FarcasterService_1.MAX_RETRY_ATTEMPTS;
                if (!shouldRetry) {
                    throw err;
                }
                await this.sleep(backoffMs);
                backoffMs = Math.min(backoffMs * 2, 5000);
            }
        }
    }
    enforceRateLimit(key) {
        const now = Date.now();
        const windowStart = now - FarcasterService_1.RATE_LIMIT_WINDOW_MS;
        const entries = this.rateLimitStore.get(key) || [];
        const recent = entries.filter((ts) => ts > windowStart);
        if (recent.length >= FarcasterService_1.RATE_LIMIT_MAX_REQUESTS) {
            throw new common_1.HttpException('Too many requests', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        recent.push(now);
        this.rateLimitStore.set(key, recent);
    }
    isRetryableError(err) {
        const axiosError = err;
        const status = axiosError?.response?.status;
        if (typeof status === 'number') {
            return status >= 500 || status === 429;
        }
        const code = axiosError?.code;
        return code === 'ECONNABORTED' || code === 'ETIMEDOUT' || !axiosError?.response;
    }
    resolveStatus(err) {
        const axiosError = err;
        const status = axiosError?.response?.status;
        if (typeof status === 'number' && status >= 400 && status < 600) {
            return status;
        }
        return common_1.HttpStatus.BAD_REQUEST;
    }
    async sleep(ms) {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.FarcasterService = FarcasterService;
exports.FarcasterService = FarcasterService = FarcasterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        encryption_service_1.EncryptionService])
], FarcasterService);
//# sourceMappingURL=farcaster.service.js.map