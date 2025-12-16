import { cacheService, CacheKeys, CacheTTL } from "../cache.service";

describe("CacheService", () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.flush();
    cacheService.resetStats();
  });

  describe("Basic Operations", () => {
    it("should set and get values from cache", () => {
      const key = "test-key";
      const value = { data: "test-data" };

      cacheService.set(key, value);
      const retrieved = cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it("should return undefined for non-existent keys", () => {
      const retrieved = cacheService.get("non-existent");
      expect(retrieved).toBeUndefined();
    });

    it("should delete values from cache", () => {
      const key = "test-key";
      cacheService.set(key, "test-value");

      const deleted = cacheService.del(key);
      expect(deleted).toBe(1);

      const retrieved = cacheService.get(key);
      expect(retrieved).toBeUndefined();
    });

    it("should check if key exists", () => {
      const key = "test-key";
      cacheService.set(key, "test-value");

      expect(cacheService.has(key)).toBe(true);
      expect(cacheService.has("non-existent")).toBe(false);
    });
  });

  describe("Pattern Deletion", () => {
    it("should delete keys matching a pattern", () => {
      cacheService.set("calendar:busy:2024-01-01:2024-01-02", []);
      cacheService.set("calendar:busy:2024-01-03:2024-01-04", []);
      cacheService.set("slots:available:2024-01-01:2024-01-02:30", []);

      const deleted = cacheService.delPattern("calendar:");
      expect(deleted).toBe(2);

      expect(cacheService.has("calendar:busy:2024-01-01:2024-01-02")).toBe(
        false
      );
      expect(cacheService.has("calendar:busy:2024-01-03:2024-01-04")).toBe(
        false
      );
      expect(cacheService.has("slots:available:2024-01-01:2024-01-02:30")).toBe(
        true
      );
    });
  });

  describe("Statistics", () => {
    it("should track cache hits and misses", () => {
      const key = "test-key";
      cacheService.set(key, "test-value");

      // Hit
      cacheService.get(key);

      // Miss
      cacheService.get("non-existent");

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.sets).toBe(1);
    });

    it("should calculate hit rate correctly", () => {
      const key = "test-key";
      cacheService.set(key, "test-value");

      // 2 hits
      cacheService.get(key);
      cacheService.get(key);

      // 1 miss
      cacheService.get("non-existent");

      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe("66.67%");
    });

    it("should reset statistics", () => {
      cacheService.set("key1", "value1");
      cacheService.get("key1");
      cacheService.get("non-existent");

      cacheService.resetStats();

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
    });
  });

  describe("Cache Key Generators", () => {
    it("should generate calendar busy slots key", () => {
      const key = CacheKeys.calendarBusySlots(
        "2024-01-01T00:00:00Z",
        "2024-01-02T00:00:00Z"
      );
      expect(key).toBe(
        "calendar:busy:2024-01-01T00:00:00Z:2024-01-02T00:00:00Z"
      );
    });

    it("should generate available slots key", () => {
      const key = CacheKeys.availableSlots(
        "2024-01-01T00:00:00Z",
        "2024-01-02T00:00:00Z",
        30
      );
      expect(key).toBe(
        "slots:available:2024-01-01T00:00:00Z:2024-01-02T00:00:00Z:30"
      );
    });

    it("should generate CRM contact key", () => {
      const key = CacheKeys.crmContact("test@example.com");
      expect(key).toBe("crm:contact:test@example.com");
    });
  });

  describe("TTL Constants", () => {
    it("should have correct TTL values", () => {
      expect(CacheTTL.CALENDAR_BUSY_SLOTS).toBe(300); // 5 minutes
      expect(CacheTTL.AVAILABLE_SLOTS).toBe(300); // 5 minutes
      expect(CacheTTL.CRM_CONTACT).toBe(1800); // 30 minutes
    });
  });

  describe("Flush", () => {
    it("should clear all cache entries", () => {
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");
      cacheService.set("key3", "value3");

      cacheService.flush();

      expect(cacheService.get("key1")).toBeUndefined();
      expect(cacheService.get("key2")).toBeUndefined();
      expect(cacheService.get("key3")).toBeUndefined();

      const stats = cacheService.getStats();
      expect(stats.keys).toBe(0);
    });
  });
});
