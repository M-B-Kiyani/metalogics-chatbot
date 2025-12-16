import { CircuitBreaker, CircuitState } from "../circuitBreaker";

describe("CircuitBreaker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("State Transitions", () => {
    it("should start in CLOSED state", () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it("should transition to OPEN after threshold failures", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));

      // Execute failing function 3 times
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it("should reject requests immediately when OPEN", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));

      // Trigger circuit to open
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Try to execute again - should be rejected immediately
      await expect(breaker.execute(failingFn)).rejects.toThrow(
        "Circuit breaker is OPEN"
      );

      // Function should not have been called
      expect(failingFn).toHaveBeenCalledTimes(2);
    });

    it("should transition to HALF_OPEN after reset timeout", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100, // Short timeout for testing
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));

      // Trigger circuit to open
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Next call should transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue("success");
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it("should transition back to CLOSED after successful call in HALF_OPEN", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));

      // Trigger circuit to open
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Successful call should close the circuit
      const successFn = jest.fn().mockResolvedValue("success");
      const result = await breaker.execute(successFn);

      expect(result).toBe("success");
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it("should transition back to OPEN if call fails in HALF_OPEN", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));

      // Trigger circuit to open
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Failed call in HALF_OPEN should reopen circuit
      try {
        await breaker.execute(failingFn);
      } catch (error) {
        // Expected to fail
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe("Success Handling", () => {
    it("should reset failure count on success", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));
      const successFn = jest.fn().mockResolvedValue("success");

      // Fail twice
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Succeed once - should reset failure count
      await breaker.execute(successFn);

      // Should still be CLOSED
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Fail twice more - should not open (count was reset)
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe("Statistics", () => {
    it("should provide accurate statistics", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const stats = breaker.getStats();

      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(0);
      expect(stats.config.name).toBe("TestBreaker");
      expect(stats.config.failureThreshold).toBe(3);
    });

    it("should update failure count in statistics", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));

      try {
        await breaker.execute(failingFn);
      } catch (error) {
        // Expected to fail
      }

      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(1);
    });
  });

  describe("Manual Reset", () => {
    it("should allow manual reset of circuit breaker", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        name: "TestBreaker",
      });

      const failingFn = jest.fn().mockRejectedValue(new Error("API Error"));

      // Trigger circuit to open
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Manual reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      const stats = breaker.getStats();
      expect(stats.failureCount).toBe(0);
    });
  });
});
