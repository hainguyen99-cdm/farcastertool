import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EncryptionService } from './encryption.service';
import type { AxiosError } from 'axios';

/**
 * Service responsible for interacting with Farcaster API endpoints.
 */
@Injectable()
export class FarcasterService {
	private readonly baseUrl: string = 'https://client.farcaster.xyz';
	private static readonly MAX_RETRY_ATTEMPTS: number = 3;
	private static readonly INITIAL_BACKOFF_MS: number = 300;
	private static readonly RATE_LIMIT_WINDOW_MS: number = 1000;
	private static readonly RATE_LIMIT_MAX_REQUESTS: number = 5;
	private readonly rateLimitStore: Map<string, number[]> = new Map<string, number[]>();

	constructor(
		private readonly httpService: HttpService,
		private readonly encryptionService: EncryptionService,
	) {}

	private buildAuthHeaders(token: string): Record<string, string> {
		return {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		};
	}

	/**
	 * Extract a random cast hash from a Farcaster feed response.
	 * Accepts varying response shapes and returns null when not found.
	 */
	getRandomCastHashFromFeed(feedResponse: unknown): string | null {
		const hashes: readonly string[] = this.extractCastHashes(feedResponse);
		if (hashes.length === 0) {
			return null;
		}
		const index: number = Math.floor(Math.random() * hashes.length);
		return hashes[index] ?? null;
	}

	/**
	 * Extract cast hash from a Farcaster URL.
	 * Supports URLs like: https://farcaster.xyz/username/0x... or https://warpcast.com/username/0x...
	 */
	extractCastHashFromUrl(url: string): string | null {
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
			// Basic validation - cast hashes are typically 0x followed by hex
			if (castHash.startsWith('0x') && castHash.length > 2) {
				return castHash;
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Get thread casts from a Farcaster URL and return the first cast hash.
	 * Uses the user-thread-casts API to get casts from a thread.
	 */
	async getFirstCastHashFromThread(encryptedToken: string, url: string): Promise<string | null> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`getThreadCasts:${encryptedToken}`);
		
		try {
			// Extract username and castHash from URL
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

			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.get(
						`${this.baseUrl}/v2/user-thread-casts`,
						{
							params: {
								castHashPrefix: castHashPrefix,
								username: username,
								limit: 15
							},
							headers: this.buildAuthHeaders(token),
						},
					),
				),
			);

			const data = response.data as any;
			const casts = data?.result?.casts;
			
			if (!Array.isArray(casts) || casts.length === 0) {
				return null;
			}

			// Return the first cast hash
			const firstCast = casts[0];
			return firstCast?.hash || null;
		} catch (err) {
			throw new HttpException('Failed to fetch thread casts', this.resolveStatus(err));
		}
	}

	private extractCastHashes(feedResponse: unknown): string[] {
		const items: unknown[] = this.findFeedItems(feedResponse);
		return items
			.map((item: unknown) => this.findCastHashOnItem(item))
			.filter((hash: string | null): hash is string => Boolean(hash));
	}

	private findFeedItems(feedResponse: unknown): unknown[] {
		if (!feedResponse || typeof feedResponse !== 'object') {
			return [];
		}
		const root = feedResponse as Record<string, unknown>;
		const candidates: Array<unknown> = [];
		const directItems = root.items as unknown;
		if (Array.isArray(directItems)) {
			candidates.push(...directItems);
		}
		const data = root.data as Record<string, unknown> | undefined;
		if (data) {
			const dataItems = data.items as unknown;
			if (Array.isArray(dataItems)) {
				candidates.push(...dataItems);
			}
			const feedItems = data.feedItems as unknown;
			if (Array.isArray(feedItems)) {
				candidates.push(...feedItems);
			}
		}
		const feedItems = root.feedItems as unknown;
		if (Array.isArray(feedItems)) {
			candidates.push(...feedItems);
		}
		return candidates;
	}

	private findCastHashOnItem(item: unknown): string | null {
		if (!item || typeof item !== 'object') {
			return null;
		}
		const obj = item as Record<string, unknown>;
		const cast = (obj.cast || obj['castItem'] || obj['fidCast']) as Record<string, unknown> | undefined;
		if (cast && typeof cast === 'object') {
			const hash = (cast.hash || cast.castHash || cast['merkleRoot']) as unknown;
			if (typeof hash === 'string' && hash.length > 0) {
				return hash;
			}
		}
		const directHash = (obj.hash || obj.castHash) as unknown;
		if (typeof directHash === 'string' && directHash.length > 0) {
			return directHash;
		}
		return null;
	}

	async getFeed(encryptedToken: string): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`getFeed:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.post(
						`${this.baseUrl}/v2/feed-items`,
						{
							feedKey: 'home',
							feedType: 'default',
							castViewEvents: [],
							updateState: true,
						},
						{ headers: this.buildAuthHeaders(token) },
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to fetch feed', this.resolveStatus(err));
		}
	}

	async likeCast(encryptedToken: string, castHash: string): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`likeCast:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.put(
						`${this.baseUrl}/v2/cast-likes`,
						{ castHash },
						{ headers: this.buildAuthHeaders(token) },
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to like cast', this.resolveStatus(err));
		}
	}

	async recastCast(encryptedToken: string, castHash: string): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`recastCast:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.put(
						`${this.baseUrl}/v2/recasts`,
						{ castHash },
						{ headers: this.buildAuthHeaders(token) },
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to recast', this.resolveStatus(err));
		}
	}

	async joinChannel(
		encryptedToken: string,
		channelKey: string,
		inviteCode: string,
	): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`joinChannel:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.put(
						`${this.baseUrl}/v1/join-channel-via-code`,
						{ channelKey, inviteCode },
						{ headers: this.buildAuthHeaders(token) },
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to join channel', this.resolveStatus(err));
		}
	}

	async pinMiniApp(encryptedToken: string, domain: string): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`pinMiniApp:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.put(
						`${this.baseUrl}/v1/favorite-frames`,
						{ domain },
						{ headers: this.buildAuthHeaders(token) },
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to pin miniapp', this.resolveStatus(err));
		}
	}

	async getUserByUsername(encryptedToken: string, username: string): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`getUserByUsername:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.get(
						`${this.baseUrl}/v2/user-by-username?username=${encodeURIComponent(username)}`,
						{ headers: this.buildAuthHeaders(token) },
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to get user by username', this.resolveStatus(err));
		}
	}

	async followUser(encryptedToken: string, targetFid: number): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`followUser:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.put(
						`${this.baseUrl}/v2/follows`,
						{ targetFid },
						{ headers: this.buildAuthHeaders(token) },
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to follow user', this.resolveStatus(err));
		}
	}

	async getOnboardingState(encryptedToken: string): Promise<{ walletAddress: string; username: string; fid: number }> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`getOnboardingState:${encryptedToken}`);
		try {
			// First call: Get onboarding state to get username and FID
			const onboardingResponse = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.get(
						'https://client.warpcast.com/v2/onboarding-state',
						{
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
						},
					),
				),
			);
			console.log('onboardingResponse', onboardingResponse.data);
			const onboardingData = onboardingResponse.data as any;
			const state = onboardingData?.result?.state;
			
			if (!state) {
				throw new Error('Invalid onboarding state response');
			}
			
			const username = state.user?.username;
			const fid = state.user?.fid;
			
			if (!username || !fid) {
				throw new Error('Missing username or FID in onboarding state response');
			}
			
			// Second call: Get user details to get the correct wallet address
			const userResponse = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.get(
						`https://client.farcaster.xyz/v2/user?fid=${fid}`,
						{
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
						},
					),
				),
			);	
			console.log('userResponse', userResponse.data);
			const userData = userResponse.data as any;
			const user = userData?.result?.user;
			const extras = userData?.result?.extras;
			
			if (!user || !extras) {
				throw new Error('Invalid user details response');
			}
			
			// Get the primary ETH wallet address from extras.ethWallets
			const ethWallets = extras.ethWallets;
			if (!ethWallets || !Array.isArray(ethWallets) || ethWallets.length === 0) {
				throw new Error('No ETH wallets found in user details');
			}
			
			// Use the first ETH wallet as the primary wallet address
			const walletAddress = ethWallets[0];
			
			if (!walletAddress) {
				throw new Error('Missing wallet address in user details');
			}
			
			return { walletAddress, username, fid };
		} catch (err) {
			throw new HttpException('Failed to get onboarding state', this.resolveStatus(err));
		}
	}

	async sendMiniAppEvent(
		encryptedToken: string,
		domain: string,
		event: string,
		platformType: string = 'web'
	): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`sendMiniAppEvent:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.put(
						`${this.baseUrl}/v2/mini-app-event`,
						{
							domain,
							event,
							platformType,
						},
						{
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
						},
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to send mini app event', this.resolveStatus(err));
		}
	}

	async sendAnalyticsEvents(
		encryptedToken: string,
		events: Array<{
			type: string;
			data: Record<string, unknown>;
			ts: number;
		}>
	): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`sendAnalyticsEvents:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.post(
						`${this.baseUrl}/v1/analytics-events`,
						{ events },
						{
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
						},
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to send analytics events', this.resolveStatus(err));
		}
	}

	/**
	 * Generate an image upload URL from Farcaster's image delivery service.
	 * Returns the upload URL and optimistic image ID.
	 */
	async generateImageUploadUrl(encryptedToken: string): Promise<{
		url: string;
		optimisticImageId: string;
	}> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`generateImageUploadUrl:${encryptedToken}`);
		try {
			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.post(
						`${this.baseUrl}/v1/generate-image-upload-url`,
						{},
						{
							headers: {
								...this.buildAuthHeaders(token),
								'accept': '*/*',
								'accept-language': 'en-US,en;q=0.9',
								'fc-amplitude-device-id': 'J1mIpCCJ7U9nPLneVJVkYE',
								'fc-amplitude-session-id': '1765852985832',
								'idempotency-key': this.generateIdempotencyKey(),
								'origin': 'https://farcaster.xyz',
								'priority': 'u=1, i',
								'referer': 'https://farcaster.xyz/',
								'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
								'sec-ch-ua-mobile': '?0',
								'sec-ch-ua-platform': '"Windows"',
								'sec-fetch-dest': 'empty',
								'sec-fetch-mode': 'cors',
								'sec-fetch-site': 'same-site',
								'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
							},
						},
					),
				),
			);
			const data = response.data as any;
			return {
				url: data.url,
				optimisticImageId: data.optimisticImageId,
			};
		} catch (err) {
			throw new HttpException('Failed to generate image upload URL', this.resolveStatus(err));
		}
	}

	/**
	 * Upload media file to the provided upload URL.
	 * Returns the image metadata including variants.
	 */
	async uploadMediaFile(uploadUrl: string, fileBuffer: Buffer, fileName: string, mimeType: string = 'image/jpeg'): Promise<any> {
		try {
			const FormData = (await import('form-data')).default;
			const formData = new FormData();
			formData.append('file', fileBuffer, {
				filename: fileName,
				contentType: mimeType,
			});

			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.post(
						uploadUrl,
						formData,
						{
							headers: {
								...formData.getHeaders(),
								'accept': '*/*',
								'accept-language': 'en-US,en;q=0.9',
								'origin': 'https://farcaster.xyz',
								'priority': 'u=1, i',
								'referer': 'https://farcaster.xyz/',
								'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
								'sec-ch-ua-mobile': '?0',
								'sec-ch-ua-platform': '"Windows"',
								'sec-fetch-dest': 'empty',
								'sec-fetch-mode': 'cors',
								'sec-fetch-site': 'cross-site',
								'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
							},
						},
					),
				),
			);
			return response.data as any;
		} catch (err) {
			throw new HttpException('Failed to upload media file', this.resolveStatus(err));
		}
	}

	/**
	 * Create a cast with optional embeds (media URLs).
	 * Text is required, embeds are optional.
	 */
	async createCast(
		encryptedToken: string,
		text: string,
		embeds?: string[]
	): Promise<unknown> {
		const token: string = this.encryptionService.decrypt(encryptedToken);
		this.enforceRateLimit(`createCast:${encryptedToken}`);
		try {
			const payload: Record<string, unknown> = { text };
			if (embeds && embeds.length > 0) {
				payload.embeds = embeds;
			}

			const response = await this.executeWithRetry(async () =>
				firstValueFrom(
					this.httpService.post(
						`${this.baseUrl}/v2/casts`,
						payload,
						{
							headers: {
								...this.buildAuthHeaders(token),
								'accept': '*/*',
								'accept-language': 'en-US,en;q=0.9',
								'fc-amplitude-device-id': 'J1mIpCCJ7U9nPLneVJVkYE',
								'fc-amplitude-session-id': '1765852985832',
								'idempotency-key': this.generateIdempotencyKey(),
								'origin': 'https://farcaster.xyz',
								'priority': 'u=1, i',
								'referer': 'https://farcaster.xyz/',
								'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
								'sec-ch-ua-mobile': '?0',
								'sec-ch-ua-platform': '"Windows"',
								'sec-fetch-dest': 'empty',
								'sec-fetch-mode': 'cors',
								'sec-fetch-site': 'same-site',
								'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
							},
						},
					),
				),
			);
			return response.data as unknown;
		} catch (err) {
			throw new HttpException('Failed to create cast', this.resolveStatus(err));
		}
	}

	private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
		let attempt: number = 0;
		let backoffMs: number = FarcasterService.INITIAL_BACKOFF_MS;
		for (;;) {
			try {
				return await operation();
			} catch (err) {
				attempt += 1;
				const shouldRetry: boolean = this.isRetryableError(err) && attempt < FarcasterService.MAX_RETRY_ATTEMPTS;
				if (!shouldRetry) {
					throw err;
				}
				await this.sleep(backoffMs);
				backoffMs = Math.min(backoffMs * 2, 5000);
			}
		}
	}

	private enforceRateLimit(key: string): void {
		const now: number = Date.now();
		const windowStart: number = now - FarcasterService.RATE_LIMIT_WINDOW_MS;
		const entries: number[] = this.rateLimitStore.get(key) || [];
		const recent: number[] = entries.filter((ts) => ts > windowStart);
		if (recent.length >= FarcasterService.RATE_LIMIT_MAX_REQUESTS) {
			throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
		}
		recent.push(now);
		this.rateLimitStore.set(key, recent);
	}

	private isRetryableError(err: unknown): boolean {
		const axiosError = err as AxiosError | undefined;
		const status: number | undefined = axiosError?.response?.status;
		if (typeof status === 'number') {
			return status >= 500 || status === 429;
		}
		const code = (axiosError as AxiosError | undefined)?.code;
		return code === 'ECONNABORTED' || code === 'ETIMEDOUT' || !axiosError?.response;
	}

	private resolveStatus(err: unknown): HttpStatus {
		const axiosError = err as AxiosError | undefined;
		const status: number | undefined = axiosError?.response?.status;
		if (typeof status === 'number' && status >= 400 && status < 600) {
			return status as HttpStatus;
		}
		return HttpStatus.BAD_REQUEST;
	}

	private async sleep(ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}

	private generateIdempotencyKey(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	}
}


