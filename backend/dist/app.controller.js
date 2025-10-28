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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const test_service_1 = require("./test.service");
const redis_test_service_1 = require("./redis-test.service");
const stats_service_1 = require("./stats.service");
const random_response_service_1 = require("./random-response.service");
let AppController = class AppController {
    appService;
    testService;
    redisTestService;
    statsService;
    randomResponseService;
    constructor(appService, testService, redisTestService, statsService, randomResponseService) {
        this.appService = appService;
        this.testService = testService;
        this.redisTestService = redisTestService;
        this.statsService = statsService;
        this.randomResponseService = randomResponseService;
    }
    getHello() {
        return this.appService.getHello();
    }
    async testMongoDB() {
        const isConnected = await this.testService.testConnection();
        return {
            success: isConnected,
            message: isConnected
                ? 'MongoDB connection test successful'
                : 'MongoDB connection test failed'
        };
    }
    async testRedis() {
        const isConnected = await this.redisTestService.testRedisConnection();
        return {
            success: isConnected,
            message: isConnected
                ? 'Redis connection test successful'
                : 'Redis connection test failed'
        };
    }
    async addTestJob(body) {
        try {
            const result = await this.redisTestService.addTestJob(body.message);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                data: { error: error.message },
            };
        }
    }
    async getStats() {
        return await this.statsService.getDashboardStats();
    }
    corsTest(req, res) {
        console.log('CORS test request headers:', req.headers);
        res.json({
            message: 'CORS test successful',
            origin: req.headers.origin,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
        });
    }
    async getRandomResponse() {
        const result = await this.randomResponseService.getRandomResponse();
        console.log(`[RandomResponse] Request #${result.stats.totalRequests}: ${result.success ? 'TRUE' : 'FALSE'}`);
        return result;
    }
    getRandomResponseStats() {
        return this.randomResponseService.getStats();
    }
    resetRandomResponseStats() {
        return this.randomResponseService.resetStatsManually();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('test-mongodb'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "testMongoDB", null);
__decorate([
    (0, common_1.Get)('test-redis'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "testRedis", null);
__decorate([
    (0, common_1.Post)('add-test-job'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "addTestJob", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('cors-test'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "corsTest", null);
__decorate([
    (0, common_1.Get)('random-response'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getRandomResponse", null);
__decorate([
    (0, common_1.Get)('random-response/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getRandomResponseStats", null);
__decorate([
    (0, common_1.Post)('random-response/reset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "resetRandomResponseStats", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        test_service_1.TestService,
        redis_test_service_1.RedisTestService,
        stats_service_1.StatsService,
        random_response_service_1.RandomResponseService])
], AppController);
//# sourceMappingURL=app.controller.js.map