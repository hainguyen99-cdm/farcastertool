import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { TestService } from './test.service';
import { RedisTestService } from './redis-test.service';
import { StatsService } from './stats.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly testService: TestService,
    private readonly redisTestService: RedisTestService,
    private readonly statsService: StatsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-mongodb')
  async testMongoDB(): Promise<{ success: boolean; message: string }> {
    const isConnected = await this.testService.testConnection();
    return {
      success: isConnected,
      message: isConnected 
        ? 'MongoDB connection test successful' 
        : 'MongoDB connection test failed'
    };
  }

  @Get('test-redis')
  async testRedis(): Promise<{ success: boolean; message: string }> {
    const isConnected = await this.redisTestService.testRedisConnection();
    return {
      success: isConnected,
      message: isConnected 
        ? 'Redis connection test successful' 
        : 'Redis connection test failed'
    };
  }

  @Post('add-test-job')
  async addTestJob(@Body() body: { message: string }): Promise<{ success: boolean; data: any }> {
    try {
      const result = await this.redisTestService.addTestJob(body.message);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        data: { error: error.message },
      };
    }
  }

  @Get('stats')
  async getStats(): Promise<any> {
    return await this.statsService.getDashboardStats();
  }
}
