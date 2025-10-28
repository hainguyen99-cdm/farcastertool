interface ResponseStats {
    totalRequests: number;
    trueResponses: number;
    falseResponses: number;
    lastResetTime: Date;
}
export declare class RandomResponseService {
    private stats;
    private readonly RESET_INTERVAL_MS;
    getRandomResponse(): Promise<{
        success: boolean;
        stats: ResponseStats;
    }>;
    getStats(): ResponseStats;
    resetStatsManually(): ResponseStats;
    private resetStats;
}
export {};
