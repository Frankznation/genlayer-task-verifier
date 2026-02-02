export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  let attempt = 0;
  let delay = options.baseDelayMs;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;
      const shouldRetry = options.shouldRetry ? options.shouldRetry(error) : true;
      if (!shouldRetry || attempt > options.retries) {
        throw error;
      }
      await sleep(delay);
      delay = Math.min(delay * 2, options.maxDelayMs);
    }
  }
};

export const jitterMs = (baseMs: number, variance = 0.15) => {
  const delta = baseMs * variance;
  const jitter = (Math.random() * 2 - 1) * delta;
  return Math.max(1000, Math.floor(baseMs + jitter));
};

export const truncateHash = (hash: string, start = 6, end = 4) => {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

export const formatPercent = (value: number, digits = 2) => {
  return `${value.toFixed(digits)}%`;
};

export class RateLimiter {
  private pending: Promise<void> = Promise.resolve();
  private nextAvailable = Date.now();

  constructor(private readonly minIntervalMs: number) {}

  async wait(): Promise<void> {
    this.pending = this.pending.then(async () => {
      const now = Date.now();
      const delay = Math.max(0, this.nextAvailable - now);
      this.nextAvailable = now + delay + this.minIntervalMs;
      if (delay > 0) {
        await sleep(delay);
      }
    });
    return this.pending;
  }
}

export const safeJsonParse = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const extractJson = (raw: string): string | null => {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return raw.slice(firstBrace, lastBrace + 1);
};
