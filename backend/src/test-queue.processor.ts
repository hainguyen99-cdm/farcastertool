import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';

@Injectable()
@Processor('test-queue')
export class TestQueueProcessor {
  @Process('test-job')
  async handleTestJob(job: Job<{ message: string; timestamp: number }>) {
    const { message, timestamp } = job.data;
    
    console.log(`Processing test job: ${message} at ${new Date(timestamp).toISOString()}`);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      processedAt: new Date().toISOString(),
      originalMessage: message,
    };
  }
}
