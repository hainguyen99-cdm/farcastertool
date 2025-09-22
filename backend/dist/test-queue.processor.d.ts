import { Job } from 'bull';
export declare class TestQueueProcessor {
    handleTestJob(job: Job<{
        message: string;
        timestamp: number;
    }>): Promise<{
        success: boolean;
        processedAt: string;
        originalMessage: string;
    }>;
}
