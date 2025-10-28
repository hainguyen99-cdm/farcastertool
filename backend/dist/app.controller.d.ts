import { AppService } from './app.service';
import { TestService } from './test.service';
import { RedisTestService } from './redis-test.service';
import { StatsService } from './stats.service';
import { RandomResponseService } from './random-response.service';
import { Request, Response } from 'express';
export declare class AppController {
    private readonly appService;
    private readonly testService;
    private readonly redisTestService;
    private readonly statsService;
    private readonly randomResponseService;
    constructor(appService: AppService, testService: TestService, redisTestService: RedisTestService, statsService: StatsService, randomResponseService: RandomResponseService);
    getHello(): string;
    testMongoDB(): Promise<{
        success: boolean;
        message: string;
    }>;
    testRedis(): Promise<{
        success: boolean;
        message: string;
    }>;
    addTestJob(body: {
        message: string;
    }): Promise<{
        success: boolean;
        data: any;
    }>;
    getStats(): Promise<any>;
    corsTest(req: Request, res: Response): void;
    getRandomResponse(): Promise<{
        success: boolean;
        stats: any;
    }>;
    getRandomResponseStats(): any;
    resetRandomResponseStats(): any;
}
