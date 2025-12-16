#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const fs = require("fs");
const path = require("path");
const form_data_1 = require("form-data");
class FarcasterCastCreator {
    baseUrl = 'https://client.farcaster.xyz';
    token;
    constructor(token, baseUrl) {
        this.token = token;
        if (baseUrl) {
            this.baseUrl = baseUrl;
        }
    }
    buildHeaders(additionalHeaders = {}) {
        return {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': `Bearer ${this.token}`,
            'content-type': 'application/json; charset=utf-8',
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
            ...additionalHeaders,
        };
    }
    generateIdempotencyKey() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    async generateImageUploadUrl() {
        console.log('📋 Step 1: Generating image upload URL...');
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/generate-image-upload-url`, {}, {
                headers: this.buildHeaders({
                    'sec-fetch-site': 'same-site',
                }),
            });
            console.log('✅ Upload URL generated successfully');
            console.log(`   URL: ${response.data.url}`);
            console.log(`   Image ID: ${response.data.optimisticImageId}`);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to generate upload URL:', error);
            throw error;
        }
    }
    async uploadMediaFile(uploadUrl, mediaPath) {
        console.log(`\n📤 Step 2: Uploading media file: ${mediaPath}`);
        try {
            if (!fs.existsSync(mediaPath)) {
                throw new Error(`File not found: ${mediaPath}`);
            }
            const fileBuffer = fs.readFileSync(mediaPath);
            const fileName = path.basename(mediaPath);
            const mimeType = this.getMimeType(mediaPath);
            console.log(`   File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
            console.log(`   MIME type: ${mimeType}`);
            const formData = new form_data_1.default();
            formData.append('file', fileBuffer, {
                filename: fileName,
                contentType: mimeType,
            });
            const response = await axios_1.default.post(uploadUrl, formData, {
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
            });
            console.log('✅ Media uploaded successfully');
            console.log(`   Image ID: ${response.data.result.id}`);
            console.log(`   Uploaded at: ${response.data.result.uploaded}`);
            console.log(`   Available variants: ${response.data.result.variants.length}`);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to upload media:', error);
            throw error;
        }
    }
    async createCast(text, mediaUrls) {
        console.log(`\n✍️  Step 3: Creating cast...`);
        console.log(`   Text: "${text}"`);
        if (mediaUrls && mediaUrls.length > 0) {
            console.log(`   Media embeds: ${mediaUrls.length}`);
            mediaUrls.forEach((url, idx) => {
                console.log(`     ${idx + 1}. ${url}`);
            });
        }
        try {
            const payload = { text };
            if (mediaUrls && mediaUrls.length > 0) {
                payload.embeds = mediaUrls;
            }
            const response = await axios_1.default.post(`${this.baseUrl}/v2/casts`, payload, {
                headers: this.buildHeaders({
                    'sec-fetch-site': 'same-site',
                }),
            });
            console.log('✅ Cast created successfully');
            if (response.data.result?.cast) {
                console.log(`   Cast hash: ${response.data.result.cast.hash}`);
                console.log(`   Text: "${response.data.result.cast.text}"`);
                if (response.data.result.cast.embeds) {
                    console.log(`   Embeds: ${response.data.result.cast.embeds.length}`);
                }
            }
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to create cast:', error);
            throw error;
        }
    }
    async createCastWithMedia(text, mediaPath) {
        console.log('🚀 Starting cast creation with media...\n');
        try {
            const uploadUrlData = await this.generateImageUploadUrl();
            const uploadResponse = await this.uploadMediaFile(uploadUrlData.url, mediaPath);
            const mediaUrl = uploadResponse.result.variants.find(v => v.includes('/original'))
                || uploadResponse.result.variants[0];
            if (!mediaUrl) {
                throw new Error('No media URL available in upload response');
            }
            console.log(`\n📎 Media URL for embed: ${mediaUrl}`);
            const castResponse = await this.createCast(text, [mediaUrl]);
            console.log('\n✨ Cast creation complete!');
            return castResponse;
        }
        catch (error) {
            console.error('\n❌ Cast creation failed:', error);
            throw error;
        }
    }
    async createTextOnlyCast(text) {
        console.log('🚀 Starting text-only cast creation...\n');
        try {
            const castResponse = await this.createCast(text);
            console.log('\n✨ Cast creation complete!');
            return castResponse;
        }
        catch (error) {
            console.error('\n❌ Cast creation failed:', error);
            throw error;
        }
    }
    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--token' && args[i + 1]) {
            options.token = args[i + 1];
            i++;
        }
        else if (args[i] === '--text' && args[i + 1]) {
            options.text = args[i + 1];
            i++;
        }
        else if (args[i] === '--media' && args[i + 1]) {
            options.mediaPath = args[i + 1];
            i++;
        }
        else if (args[i] === '--base-url' && args[i + 1]) {
            options.baseUrl = args[i + 1];
            i++;
        }
    }
    if (!options.token) {
        throw new Error('Missing required argument: --token');
    }
    if (!options.text) {
        throw new Error('Missing required argument: --text');
    }
    return options;
}
async function main() {
    try {
        const options = parseArgs();
        const creator = new FarcasterCastCreator(options.token, options.baseUrl);
        let result;
        if (options.mediaPath) {
            result = await creator.createCastWithMedia(options.text, options.mediaPath);
        }
        else {
            result = await creator.createTextOnlyCast(options.text);
        }
        console.log('\n📊 Final Result:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error:', error?.message ?? error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=createCast.js.map