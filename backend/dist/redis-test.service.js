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
exports.RedisTestService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
let RedisTestService = class RedisTestService {
    testQueue;
    constructor(testQueue) {
        this.testQueue = testQueue;
    }
    async testRedisConnection() {
        try {
            const job = await this.testQueue.add('test-job', {
                message: 'Redis connection test',
                timestamp: Date.now(),
            });
            const result = await job.finished();
            console.log('Redis test job completed:', result);
            return result.success === true;
        }
        catch (error) {
            console.error('Redis connection test failed:', error);
            return false;
        }
    }
    async addTestJob(message) {
        const job = await this.testQueue.add('test-job', {
            message,
            timestamp: Date.now(),
        });
        return {
            jobId: job.id,
            message: 'Job added to queue successfully',
        };
    }
};
exports.RedisTestService = RedisTestService;
exports.RedisTestService = RedisTestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('test-queue')),
    __metadata("design:paramtypes", [Object])
], RedisTestService);
//# sourceMappingURL=redis-test.service.js.map