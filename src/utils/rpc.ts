// Client RPC tool
import { ethers } from 'ethers';
import { createCache } from './performance';
import { getRpcUrl } from '@/utils/chainServices'; // Import new getRpcUrl

// Create RPC response cache
const rpcCache = createCache<any>();

// Optimized RPC tool
export function getRpcUrlOptimized(chain: string): string {
  return getRpcUrl(chain); // Use new getRpcUrl
}

export async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = 3,
  delay = 1000,
  cacheKey?: string // Add cache key parameter
): Promise<T> {
  // Check cache
  if (cacheKey) {
    const cached = rpcCache.get(cacheKey);
    if (cached) return cached;
  }

  try {
    const result = await fn();
    // Save to cache
    if (cacheKey) {
      rpcCache.set(cacheKey, result);
    }
    return result;
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5, cacheKey);
  }
}

// Batch request processor
export class BatchRequestHandler {
  private queue: Array<{
    method: string;
    params: any[];
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private provider: ethers.JsonRpcProvider,
    private batchSize: number = 10,
    private delay: number = 50
  ) {}

  public async addRequest(method: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ method, params, resolve, reject });
      this.scheduleBatch();
    });
  }

  private scheduleBatch() {
    if (this.timeout) return;
    
    this.timeout = setTimeout(() => {
      this.processBatch();
    }, this.delay);
  }

  private async processBatch() {
    const batch = this.queue.splice(0, this.batchSize);
    this.timeout = null;

    if (batch.length === 0) return;

    try {
      const results = await this.provider.send(
        batch.map(({ method, params }) => ({
          jsonrpc: '2.0',
          id: Math.random(),
          method,
          params
        }))
      );

      results.forEach((result: any, i: number) => {
        if (result.error) {
          batch[i].reject(result.error);
        } else {
          batch[i].resolve(result.result);
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
} 