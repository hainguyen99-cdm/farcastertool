"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomResponseService = void 0;
const common_1 = require("@nestjs/common");
let RandomResponseService = class RandomResponseService {
    stats = {
        totalRequests: 0,
        trueResponses: 0,
        falseResponses: 0,
        lastResetTime: new Date(),
    };
    RESET_INTERVAL_MS = 30 * 1000;
    async getRandomResponse() {
        const now = new Date();
        const timeSinceLastReset = now.getTime() - this.stats.lastResetTime.getTime();
        if (timeSinceLastReset >= this.RESET_INTERVAL_MS) {
            this.resetStats(now);
        }
        this.stats.totalRequests++;
        const shouldReturnTrue = this.stats.trueResponses === 0;
        if (shouldReturnTrue) {
            this.stats.trueResponses++;
        }
        else {
            this.stats.falseResponses++;
        }
        return {
            success: shouldReturnTrue,
            stats: { ...this.stats },
        };
    }
    getStats() {
        return { ...this.stats };
    }
    resetStatsManually() {
        this.resetStats(new Date());
        return { ...this.stats };
    }
    resetStats(resetTime) {
        this.stats = {
            totalRequests: 0,
            trueResponses: 0,
            falseResponses: 0,
            lastResetTime: resetTime,
        };
        console.log(`[RandomResponse] Stats reset at ${resetTime.toISOString()}`);
    }
};
exports.RandomResponseService = RandomResponseService;
exports.RandomResponseService = RandomResponseService = __decorate([
    (0, common_1.Injectable)()
], RandomResponseService);
//# sourceMappingURL=random-response.service.js.map