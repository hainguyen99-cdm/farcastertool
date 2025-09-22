import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class RedisTestService {
  constructor(
    @InjectQueue('test-queue') private testQueue: Queue,
  ) {}

  async testRedisConnection(): Promise<boolean> {
    try {
      // Test adding a job to the queue
      const job = await this.testQueue.add('test-job', {
        message: 'Redis connection test',
        timestamp: Date.now(),
      });

      // Wait for the job to complete
      const result = await job.finished();
      
      console.log('Redis test job completed:', result);
      return result.success === true;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }

  async addTestJob(message: string): Promise<any> {
    const job = await this.testQueue.add('test-job', {
      message,
      timestamp: Date.now(),
    });
    
    return {
      jobId: job.id,
      message: 'Job added to queue successfully',
    };
  }
}
