import NodeCache from "node-cache";
import { logger } from "./logger";

/**
 * Cache service for performance optimization
 * Provides caching for calendar busy slots, available slots, and CRM contact lookups
 */
class CacheService {
  private cache: NodeCache;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor() {
    // Initialize cache with default settings
    this.cache = new NodeCache({
      stdTTL: 300, // Default TTL: 5 minutes
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Don't clone objects for better performance
    });

    // Log cache events
    this.cache.on("set", (key: string) => {
      this.stats.sets++;
      logger.debug(`Cache SET: ${key}`);
    });

    this.cache.on("del", (key: string) => {
      this.stats.deletes++;
      logger.debug(`Cache DELETE: ${key}`);
    });

    this.cache.on("expired", (key: string) => {
      logger.debug(`Cache EXPIRED: ${key}`);
    });
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.stats.hits++;
      logger.debug(`Cache HIT: ${key}`);
    } else {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
    }
    return value;
  }

  /**
   * Set value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 0);
  }

  /**
   * Delete value from cache
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Delete multiple keys from cache
   */
  delMultiple(keys: string[]): number {
    return this.cache.del(keys);
  }

  /**
   * Delete all keys matching a pattern
   */
  delPattern(pattern: string): number {
    const keys = this.cache.keys().filter((key) => key.includes(pattern));
    return this.cache.del(keys);
  }

  /**
   * Clear all cache entries
   */
  flush(): void {
    this.cache.flushAll();
    logger.info("Cache flushed");
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      keys: keys.length,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      hitRate: hitRate.toFixed(2) + "%",
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators for different types of cached data
export const CacheKeys = {
  // Calendar busy slots: cache for 5 minutes
  calendarBusySlots: (startDate: string, endDate: string) =>
    `calendar:busy:${startDate}:${endDate}`,

  // Available slots: cache for 5 minutes
  availableSlots: (startDate: string, endDate: string, duration: number) =>
    `slots:available:${startDate}:${endDate}:${duration}`,

  // HubSpot contact lookup: cache for 30 minutes
  crmContact: (email: string) => `crm:contact:${email}`,

  // Pattern matchers for bulk deletion
  patterns: {
    calendar: "calendar:",
    slots: "slots:",
    crm: "crm:",
  },
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  CALENDAR_BUSY_SLOTS: 300, // 5 minutes
  AVAILABLE_SLOTS: 300, // 5 minutes
  CRM_CONTACT: 1800, // 30 minutes
};
