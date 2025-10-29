import { Injectable } from '@nestjs/common';

interface ResponseStats {
  totalRequests: number;
  trueResponses: number;
  falseResponses: number;
  lastResetTime: Date;
  randomPosition?: number; // Vị trí random được chọn trong window này
}

@Injectable()
export class RandomResponseService {
  private stats: ResponseStats = {
    totalRequests: 0,
    trueResponses: 0,
    falseResponses: 0,
    lastResetTime: new Date(),
    randomPosition: undefined,
  };

  private readonly RESET_INTERVAL_MS = 15 * 1000; // 15 seconds

  /**
   * Get random response based on 30-second window
   * Returns true for exactly 1 random request per 30-second window
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

    // Random logic: chọn vị trí random ngay từ request đầu tiên
    if (this.stats.randomPosition === undefined) {
      // Ước tính số request có thể có trong 15s (ví dụ: 15 requests)
      const estimatedMaxRequests = 15;
      this.stats.randomPosition = Math.floor(Math.random() * estimatedMaxRequests) + 1;
      console.log(`[RandomResponse] Random position set to: ${this.stats.randomPosition}`);
    }

    // Kiểm tra xem request hiện tại có phải là vị trí random không
    const shouldReturnTrue = (this.stats.totalRequests === this.stats.randomPosition);

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
      randomPosition: undefined,
    };
    console.log(`[RandomResponse] Stats reset at ${resetTime.toISOString()}`);
  }
}
