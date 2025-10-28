import { Injectable } from '@nestjs/common';

interface ResponseStats {
  totalRequests: number;
  trueResponses: number;
  falseResponses: number;
  lastResetTime: Date;
  randomPositions?: number[]; // Danh sách các vị trí random được chọn trong window này
}

@Injectable()
export class RandomResponseService {
  private stats: ResponseStats = {
    totalRequests: 0,
    trueResponses: 0,
    falseResponses: 0,
    lastResetTime: new Date(),
    randomPositions: undefined,
  };

  private readonly RESET_INTERVAL_MS = 30 * 1000; // 30 seconds

  /**
   * Get random response based on 30-second window
   * Returns true for exactly 10 random requests per 30-second window
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

    // Random logic: chọn 10 vị trí random ngay từ request đầu tiên
    if (this.stats.randomPositions === undefined) {
      // Ước tính số request có thể có trong 30s (ví dụ: 100 requests)
      const estimatedMaxRequests = 100;
      const numberOfTrueResponses = 10;
      
      // Tạo array các số từ 1 đến estimatedMaxRequests
      const allPositions = Array.from({ length: estimatedMaxRequests }, (_, i) => i + 1);
      
      // Shuffle và lấy 10 vị trí đầu tiên
      const shuffled = allPositions.sort(() => Math.random() - 0.5);
      this.stats.randomPositions = shuffled.slice(0, numberOfTrueResponses).sort((a, b) => a - b);
      
      console.log(`[RandomResponse] Random positions set to: [${this.stats.randomPositions.join(', ')}]`);
    }

    // Kiểm tra xem request hiện tại có phải là một trong các vị trí random không
    const shouldReturnTrue = this.stats.randomPositions.includes(this.stats.totalRequests);

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
      randomPositions: undefined,
    };
    console.log(`[RandomResponse] Stats reset at ${resetTime.toISOString()}`);
  }
}
