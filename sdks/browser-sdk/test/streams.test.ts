import { describe, expect, it, vi } from "vitest";
import {
  StreamFailedError,
  StreamInvalidRetryAttemptsError,
} from "@/utils/errors";
import {
  createStream,
  DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_RETRY_DELAY,
  type StreamCallback,
  type StreamFunction,
} from "@/utils/streams";
import { sleep } from "@test/helpers";

describe("createStream", () => {
  describe("basic functionality", () => {
    it("should create a stream and emit values", async () => {
      const values: number[] = [];
      const onValueSpy = vi.fn<(value: number) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 1);
          callback(null, 2);
          callback(null, 3);
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onValue: onValueSpy,
      });

      // Collect values
      setTimeout(() => {
        void stream.end();
      }, 50);

      for await (const value of stream) {
        values.push(value);
      }

      expect(values).toEqual([1, 2, 3]);
      expect(onValueSpy).toHaveBeenCalledTimes(3);
      expect(onValueSpy).toHaveBeenCalledWith(1);
      expect(onValueSpy).toHaveBeenCalledWith(2);
      expect(onValueSpy).toHaveBeenCalledWith(3);
    });

    it("should ignore undefined values", async () => {
      const values: number[] = [];
      const onValueSpy = vi.fn<(value: number) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 1);
          callback(null, undefined);
          callback(null, 2);
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onValue: onValueSpy,
      });

      setTimeout(() => {
        void stream.end();
      }, 50);

      for await (const value of stream) {
        values.push(value);
      }

      expect(values).toEqual([1, 2]);
      expect(onValueSpy).toHaveBeenCalledTimes(2);
    });

    it("should call onEnd when stream ends", async () => {
      const onEndSpy = vi.fn();

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 1);
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onEnd: onEndSpy,
      });

      await stream.end();

      expect(onEndSpy).toHaveBeenCalledTimes(1);
    });

    it("should call streamCloser when stream ends", async () => {
      const streamCloserSpy = vi.fn();

      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        return Promise.resolve(streamCloserSpy);
      });

      const stream = await createStream(mockStreamFunction);

      await stream.end();

      expect(streamCloserSpy).toHaveBeenCalledTimes(1);
    });

    it("should work with default options", async () => {
      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 42);
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction);

      setTimeout(() => {
        void stream.end();
      }, 50);

      const values: number[] = [];
      for await (const value of stream) {
        values.push(value);
      }

      expect(values).toEqual([42]);
    });
  });

  describe("stream value mutators", () => {
    it("should apply sync mutator to values", async () => {
      const onValueSpy = vi.fn<(value: number) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 5);
          return Promise.resolve(() => {});
        },
      );

      const mutator = (value: number) => value * 2;

      const stream = await createStream(mockStreamFunction, mutator, {
        onValue: onValueSpy,
      });

      setTimeout(() => {
        void stream.end();
      }, 50);

      const values: number[] = [];
      for await (const value of stream) {
        values.push(value);
      }

      expect(values).toEqual([10]);
      expect(onValueSpy).toHaveBeenCalledWith(10);
    });

    it("should apply async mutator to values", async () => {
      const onValueSpy = vi.fn<(value: number) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 5);
          return Promise.resolve(() => {});
        },
      );

      const asyncMutator = async (value: number) => {
        await sleep(10);
        return value * 3;
      };

      const stream = await createStream(mockStreamFunction, asyncMutator, {
        onValue: onValueSpy,
      });

      setTimeout(() => {
        void stream.end();
      }, 100);

      const values: number[] = [];
      for await (const value of stream) {
        values.push(value);
      }

      expect(values).toEqual([15]);
      expect(onValueSpy).toHaveBeenCalledWith(15);
    });

    it("should call onError when sync mutator throws", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();
      const mutatorError = new Error("Mutator error");

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 5);
          return Promise.resolve(() => {});
        },
      );

      const throwingMutator = (): number => {
        throw mutatorError;
      };

      const stream = await createStream(mockStreamFunction, throwingMutator, {
        onError: onErrorSpy,
      });

      await sleep(50);
      await stream.end();

      expect(onErrorSpy).toHaveBeenCalledWith(mutatorError);
    });

    it("should call onError when async mutator rejects", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();
      const mutatorError = new Error("Async mutator error");

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 5);
          return Promise.resolve(() => {});
        },
      );

      const rejectingMutator = async (): Promise<number> => {
        await sleep(10);
        throw mutatorError;
      };

      const stream = await createStream(mockStreamFunction, rejectingMutator, {
        onError: onErrorSpy,
      });

      await sleep(100);
      await stream.end();

      expect(onErrorSpy).toHaveBeenCalledWith(mutatorError);
    });
  });

  describe("error handling", () => {
    it("should call onError when stream callback receives an error", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();
      const streamError = new Error("Stream error");

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(streamError, undefined);
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onError: onErrorSpy,
      });

      await sleep(50);
      await stream.end();

      expect(onErrorSpy).toHaveBeenCalledWith(streamError);
    });

    it("should throw StreamInvalidRetryAttemptsError when retryAttempts < 0 and retryOnFail is true", async () => {
      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        return Promise.resolve(() => {});
      });

      await expect(
        createStream(mockStreamFunction, undefined, {
          retryAttempts: -1,
          retryOnFail: true,
        }),
      ).rejects.toThrow(StreamInvalidRetryAttemptsError);
    });

    it("should not throw when retryAttempts < 0 and retryOnFail is false", async () => {
      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        retryAttempts: -1,
        retryOnFail: false,
      });

      await stream.end();
    });
  });

  describe("stream failure without retry", () => {
    it("should call onFail when stream fails and retryOnFail is false", async () => {
      const onFailSpy = vi.fn<() => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (_, onFail: () => void) => {
          // Call onFail synchronously so the throw is caught
          onFail();
          return Promise.resolve(() => {});
        },
      );

      // When retryOnFail is false, StreamFailedError is thrown
      await expect(
        createStream(mockStreamFunction, undefined, {
          onFail: onFailSpy,
          retryOnFail: false,
        }),
      ).rejects.toThrow(StreamFailedError);

      expect(onFailSpy).toHaveBeenCalledTimes(1);
    });

    it("should throw StreamFailedError with 0 retries when retryOnFail is false", async () => {
      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (_, onFail: () => void) => {
          onFail();
          return Promise.resolve(() => {});
        },
      );

      try {
        await createStream(mockStreamFunction, undefined, {
          retryOnFail: false,
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(StreamFailedError);
        expect((error as Error).message).toBe("Stream failed, retried 0 times");
      }
    });

    it("should throw StreamFailedError with singular 'time' when retryAttempts is 1", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        throw new Error("Always fails");
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onError: onErrorSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 1,
      });

      await sleep(100);
      await stream.end();

      // Find the StreamFailedError
      const streamFailedError = onErrorSpy.mock.calls
        .map((call) => call[0])
        .find((e) => e instanceof StreamFailedError);

      expect(streamFailedError).toBeDefined();
      expect(streamFailedError!.message).toBe("Stream failed, retried 1 time");
    });
  });

  describe("stream failure with retry", () => {
    it("should call onFail when stream fails", async () => {
      const onFailSpy = vi.fn<() => void>();
      let callCount = 0;

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (_, onFail: () => void) => {
          callCount++;
          if (callCount === 1) {
            setTimeout(() => {
              onFail();
            }, 0);
          }
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onFail: onFailSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 1,
      });

      await sleep(100);
      await stream.end();

      expect(onFailSpy).toHaveBeenCalled();
    });

    it("should call onRetry when retrying", async () => {
      const onRetrySpy =
        vi.fn<(attempts: number, maxAttempts: number) => void>();
      let callCount = 0;

      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Initial failure");
        }
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onRetry: onRetrySpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 3,
      });

      await sleep(100);
      await stream.end();

      // onRetry should be called with (currentAttempt, maxAttempts)
      expect(onRetrySpy).toHaveBeenCalledWith(1, 3);
    });

    it("should call onRestart when stream restarts successfully", async () => {
      const onRestartSpy = vi.fn<() => void>();
      let callCount = 0;

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callCount++;
          if (callCount === 1) {
            throw new Error("Initial failure");
          }
          callback(null, 42);
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onRestart: onRestartSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 3,
      });

      await sleep(100);
      await stream.end();

      expect(onRestartSpy).toHaveBeenCalledTimes(1);
    });

    it("should fail after max retry attempts with StreamFailedError", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();

      // This mock always throws, simulating a stream that always fails
      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        throw new Error("Always fails");
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onError: onErrorSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 2,
      });

      await sleep(200);
      await stream.end();

      // Should have received StreamFailedError at the end
      const errors = onErrorSpy.mock.calls.map((call) => call[0]);
      const streamFailedErrors = errors.filter(
        (e) => e instanceof StreamFailedError,
      );
      expect(streamFailedErrors.length).toBeGreaterThan(0);
      expect(streamFailedErrors[0].message).toBe(
        "Stream failed, retried 2 times",
      );
    });

    it("should use custom retryDelay", async () => {
      const onRetrySpy =
        vi.fn<(attempts: number, maxAttempts: number) => void>();
      const startTime = Date.now();

      let callCount = 0;
      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Initial failure");
        }
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onRetry: onRetrySpy,
        retryOnFail: true,
        retryDelay: 50,
        retryAttempts: 1,
      });

      await sleep(200);
      await stream.end();

      const elapsed = Date.now() - startTime;
      // Retry should happen after approximately 50ms
      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(onRetrySpy).toHaveBeenCalled();
    });

    it("should use default retry values", () => {
      expect(DEFAULT_RETRY_ATTEMPTS).toBe(6);
      expect(DEFAULT_RETRY_DELAY).toBe(10000);
    });
  });

  describe("initial stream function failure", () => {
    it("should retry when streamFunction throws initially", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();
      const onRetrySpy =
        vi.fn<(attempts: number, maxAttempts: number) => void>();
      let callCount = 0;

      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Initial failure");
        }
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onError: onErrorSpy,
        onRetry: onRetrySpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 3,
      });

      await sleep(100);
      await stream.end();

      expect(onErrorSpy).toHaveBeenCalledWith(new Error("Initial failure"));
      expect(onRetrySpy).toHaveBeenCalled();
    });

    it("should throw StreamFailedError when initial failure and retryOnFail is false", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        throw new Error("Initial failure");
        return Promise.resolve(() => {});
      });

      try {
        await createStream(mockStreamFunction, undefined, {
          onError: onErrorSpy,
          retryOnFail: false,
        });
        expect.fail("Should have thrown");
      } catch (error) {
        // The StreamFailedError is thrown
        expect(error).toBeInstanceOf(StreamFailedError);
      }

      // onError is called with the initial error
      expect(onErrorSpy).toHaveBeenCalledWith(new Error("Initial failure"));
    });
  });

  describe("retry during retry", () => {
    it("should call onFail during retry when stream fails again via onFail callback", async () => {
      const onFailSpy = vi.fn<() => void>();
      let callCount = 0;

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (_, onFail: () => void) => {
          callCount++;
          if (callCount === 1) {
            // First call fails immediately via throw
            throw new Error("Initial failure");
          }
          if (callCount === 2) {
            // Second call (retry) fails via onFail callback
            setTimeout(() => {
              onFail();
            }, 0);
          }
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onFail: onFailSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 3,
      });

      await sleep(200);
      await stream.end();

      // onFail should be called when the stream fails via the onFail callback
      expect(onFailSpy).toHaveBeenCalled();
    });

    it("should call onEnd and streamCloser after successful retry", async () => {
      const onEndSpy = vi.fn<() => void>();
      const streamCloserSpy = vi.fn();
      let callCount = 0;

      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callCount++;
          if (callCount === 1) {
            throw new Error("Initial failure");
          }
          // Successful on retry
          callback(null, 42);
          return Promise.resolve(streamCloserSpy);
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onEnd: onEndSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 3,
      });

      await sleep(100);
      await stream.end();

      expect(streamCloserSpy).toHaveBeenCalledTimes(1);
      expect(onEndSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("retry function error handling", () => {
    it("should call onRetry with correct attempt numbers when streamFunction throws", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();
      const onRetrySpy =
        vi.fn<(attempts: number, maxAttempts: number) => void>();

      // Mock that always throws
      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        throw new Error("Always fails");
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onError: onErrorSpy,
        onRetry: onRetrySpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 3,
      });

      await sleep(100);
      await stream.end();

      // onRetry should be called with (currentAttempt, maxAttempts)
      // At minimum, the first 3 attempts should have occurred
      expect(onRetrySpy).toHaveBeenCalledWith(1, 3);
      expect(onRetrySpy).toHaveBeenCalledWith(2, 3);
      expect(onRetrySpy).toHaveBeenCalledWith(3, 3);

      // Should have received StreamFailedError
      const errors = onErrorSpy.mock.calls.map((call) => call[0]);
      const streamFailedErrors = errors.filter(
        (e) => e instanceof StreamFailedError,
      );
      expect(streamFailedErrors.length).toBeGreaterThan(0);
    });

    it("should call onError for each failed retry attempt", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        throw new Error("Always fails");
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onError: onErrorSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 2,
      });

      await sleep(200);
      await stream.end();

      // onError should be called multiple times
      // Initial error + errors during retries + StreamFailedError
      expect(onErrorSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe("edge cases", () => {
    it("should handle retryAttempts of 0", async () => {
      const onErrorSpy = vi.fn<(error: Error) => void>();

      const mockStreamFunction: StreamFunction<number> = vi.fn(async () => {
        throw new Error("Initial failure");
        return Promise.resolve(() => {});
      });

      const stream = await createStream(mockStreamFunction, undefined, {
        onError: onErrorSpy,
        retryOnFail: true,
        retryDelay: 10,
        retryAttempts: 0,
      });

      await sleep(100);
      await stream.end();

      // With 0 retry attempts, it should fail immediately
      const errors = onErrorSpy.mock.calls.map((call) => call[0]);
      const streamFailedErrors = errors.filter(
        (e) => e instanceof StreamFailedError,
      );
      expect(streamFailedErrors.length).toBeGreaterThan(0);
    });

    it("should handle no options provided", async () => {
      const mockStreamFunction: StreamFunction<number> = vi.fn(
        async (callback: StreamCallback<number>) => {
          callback(null, 1);
          return Promise.resolve(() => {});
        },
      );

      // Call without options
      const stream = await createStream(mockStreamFunction);

      setTimeout(() => {
        void stream.end();
      }, 50);

      const values: number[] = [];
      for await (const value of stream) {
        values.push(value);
      }

      expect(values).toEqual([1]);
    });

    it("should handle no mutator with onValue callback", async () => {
      const onValueSpy = vi.fn<(value: string) => void>();

      const mockStreamFunction: StreamFunction<string> = vi.fn(
        async (callback: StreamCallback<string>) => {
          callback(null, "test");
          return Promise.resolve(() => {});
        },
      );

      const stream = await createStream(mockStreamFunction, undefined, {
        onValue: onValueSpy,
      });

      await sleep(50);
      await stream.end();

      expect(onValueSpy).toHaveBeenCalledWith("test");
    });
  });
});
