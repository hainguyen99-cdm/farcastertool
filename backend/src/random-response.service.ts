import { Injectable } from '@nestjs/common';

interface ResponseStats {
  totalRequests: number;
  trueResponses: number;
  falseResponses: number;
  lastResetTime: Date;
}

@Injectable()
export class RandomResponseService {
  private stats: ResponseStats = {
    totalRequests: 0,
    trueResponses: 0,
    falseResponses: 0,
    lastResetTime: new Date(),
  };

  private readonly RESET_INTERVAL_MS = 30 * 1000; // 30 seconds

  /**
   * Get random response based on 30-second window
   * Returns true for exactly 1 request per 30-second window
   * @returns Promise<{ success: boolean; stats: ResponseStats }>
   */
  async getRandomResponse(): Promise<{ success: boolean; stats: ResponseStats }> {
    const now = new Date();
    const timeSinceLastReset = now.getTime() - this.stats.lastResetTime.getTime();

    // Reset stats every 30 seconds
    if (timeSinceLastReset >= this.RESET_INTERVAL_MS) {
      this.resetStats(now);
    }

    this.stats.totalRequests++;

    // If we haven't returned true yet in this window, return true
    // Otherwise, return false
    const shouldReturnTrue = this.stats.trueResponses === 0;

    if (shouldReturnTrue) {
      this.stats.trueResponses++;
    } else {
      this.stats.falseResponses++;
    }

    return {
      success: shouldReturnTrue,
      stats: { ...this.stats },
    };
  }

  /**
   * Get current stats without making a request
   * @returns ResponseStats
   */
  getStats(): ResponseStats {
    return { ...this.stats };
  }

  /**
   * Reset stats manually
   */
  resetStatsManually(): ResponseStats {
    this.resetStats(new Date());
    return { ...this.stats };
  }

  private resetStats(resetTime: Date): void {
    this.stats = {
      totalRequests: 0,
      trueResponses: 0,
      falseResponses: 0,
      lastResetTime: resetTime,
    };
    console.log(`[RandomResponse] Stats reset at ${resetTime.toISOString()}`);
  }
}
