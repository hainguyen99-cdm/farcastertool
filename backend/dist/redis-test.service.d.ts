import { Queue } from 'bull';
export declare class RedisTestService {
    private testQueue;
    constructor(testQueue: Queue);
    testRedisConnection(): Promise<boolean>;
    addTestJob(message: string): Promise<any>;
}
