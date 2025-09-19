import type { StreamCloser } from "@xmtp/node-bindings";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StreamFailedError,
  StreamInvalidRetryAttemptsError,
} from "@/utils/errors";
import {
  createStream,
  type StreamFunction,
  type StreamOptions,
} from "@/utils/streams";

describe("createStream", () => {
  let mockStreamCloser: StreamCloser;

  beforeEach(() => {
    mockStreamCloser = {
      end: vi.fn(),
      waitForReady: vi.fn().mockResolvedValue(undefined),
      endAndWait: vi.fn().mockResolvedValue(undefined),
      isClosed: vi.fn().mockReturnValue(false),
    };
  });

  it("should pass StreamFailedError to onError when retryOnFail is false", async () => {
    const onErrorSpy = vi.fn();
    const onFailSpy = vi.fn();

    // Create a stream function that immediately calls onFail
    const streamFunction: StreamFunction<string> = vi.fn(
      async (callback, onFail) => {
        // Simulate stream failure immediately
        setTimeout(() => onFail(), 0);
        return mockStreamCloser;
      },
    );

    const options: StreamOptions<string> = {
      retryOnFail: false,
      onError: onErrorSpy,
      onFail: onFailSpy,
    };

    const stream = await createStream(streamFunction, undefined, options);

    // Wait for the failure to propagate
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify that onError was called with StreamFailedError instead of throwing
    expect(onErrorSpy).toHaveBeenCalledWith(expect.any(StreamFailedError));
    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Stream failed, retried 0 times",
      }),
    );
    expect(onFailSpy).toHaveBeenCalled();
  });

  it("should pass StreamFailedError to onError when all retry attempts are exhausted", async () => {
    const onErrorSpy = vi.fn();
    const onFailSpy = vi.fn();
    const onRetrySpy = vi.fn();

    // Create a stream function that always fails
    const streamFunction: StreamFunction<string> = vi.fn(
      async (callback, onFail) => {
        // Simulate immediate failure
        setTimeout(() => onFail(), 0);
        return mockStreamCloser;
      },
    );

    const options: StreamOptions<string> = {
      retryAttempts: 2,
      retryDelay: 10, // Very short delay for testing
      retryOnFail: true,
      onError: onErrorSpy,
      onFail: onFailSpy,
      onRetry: onRetrySpy,
    };

    const stream = await createStream(streamFunction, undefined, options);

    // Wait for all retries to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify that onError was called with StreamFailedError for exhausted retries
    expect(onErrorSpy).toHaveBeenCalledWith(expect.any(StreamFailedError));
    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Stream failed, retried 2 times",
      }),
    );
    expect(onFailSpy).toHaveBeenCalled();
    expect(onRetrySpy).toHaveBeenCalledTimes(2);
    expect(onRetrySpy).toHaveBeenNthCalledWith(1, 1, 2);
    expect(onRetrySpy).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it("should work normally when stream doesn't fail", async () => {
    const onErrorSpy = vi.fn();
    const onValueSpy = vi.fn();
    let streamCallback: any;

    const streamFunction: StreamFunction<string> = vi.fn(
      async (callback, onFail) => {
        streamCallback = callback;
        return mockStreamCloser;
      },
    );

    const options: StreamOptions<string> = {
      onError: onErrorSpy,
      onValue: onValueSpy,
    };

    const stream = await createStream(streamFunction, undefined, options);

    // Simulate receiving values
    streamCallback(null, "test value 1");
    streamCallback(null, "test value 2");

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify normal operation
    expect(onValueSpy).toHaveBeenCalledTimes(2);
    expect(onValueSpy).toHaveBeenCalledWith("test value 1");
    expect(onValueSpy).toHaveBeenCalledWith("test value 2");
    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  it("should call onError for stream callback errors without throwing", async () => {
    const onErrorSpy = vi.fn();
    let streamCallback: any;

    const streamFunction: StreamFunction<string> = vi.fn(
      async (callback, onFail) => {
        streamCallback = callback;
        return mockStreamCloser;
      },
    );

    const options: StreamOptions<string> = {
      onError: onErrorSpy,
    };

    const stream = await createStream(streamFunction, undefined, options);

    // Simulate an error from the stream
    const testError = new Error("Stream callback error");
    streamCallback(testError, undefined);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify that the error was passed to onError
    expect(onErrorSpy).toHaveBeenCalledWith(testError);
  });

  it("should handle stream function initialization errors via onError", async () => {
    const onErrorSpy = vi.fn();
    const initError = new Error("Stream initialization failed");

    const streamFunction: StreamFunction<string> = vi.fn(
      async (callback, onFail) => {
        throw initError;
      },
    );

    const options: StreamOptions<string> = {
      retryOnFail: false,
      onError: onErrorSpy,
    };

    const stream = await createStream(streamFunction, undefined, options);

    // Wait for error handling
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify that initialization errors are also passed to onError
    expect(onErrorSpy).toHaveBeenCalledWith(initError);
    // Should also get the StreamFailedError since retryOnFail is false
    expect(onErrorSpy).toHaveBeenCalledWith(expect.any(StreamFailedError));
  });

  it("should still throw StreamInvalidRetryAttemptsError for invalid retry attempts", async () => {
    const streamFunction: StreamFunction<string> = vi.fn();

    const options: StreamOptions<string> = {
      retryAttempts: -1,
      retryOnFail: true,
    };

    // This should still throw synchronously as it's a configuration error
    await expect(
      createStream(streamFunction, undefined, options),
    ).rejects.toThrow(StreamInvalidRetryAttemptsError);
  });

  it("should work with stream value mutator and handle mutator errors", async () => {
    const onErrorSpy = vi.fn();
    const onValueSpy = vi.fn();
    let streamCallback: any;

    const streamFunction: StreamFunction<number> = vi.fn(
      async (callback, onFail) => {
        streamCallback = callback;
        return mockStreamCloser;
      },
    );

    const mutatorError = new Error("Mutator error");
    const streamValueMutator = vi.fn((value: number) => {
      if (value === 2) {
        throw mutatorError;
      }
      return value * 10;
    });

    const options: StreamOptions<number, number> = {
      onError: onErrorSpy,
      onValue: onValueSpy,
    };

    const stream = await createStream(
      streamFunction,
      streamValueMutator,
      options,
    );

    // Simulate receiving values
    streamCallback(null, 1); // Should work
    streamCallback(null, 2); // Should cause mutator error
    streamCallback(null, 3); // Should work

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify mutator worked for valid values
    expect(onValueSpy).toHaveBeenCalledWith(10);
    expect(onValueSpy).toHaveBeenCalledWith(30);
    expect(onValueSpy).toHaveBeenCalledTimes(2);

    // Verify mutator error was passed to onError
    expect(onErrorSpy).toHaveBeenCalledWith(mutatorError);
  });

  it("should handle async stream value mutator errors", async () => {
    const onErrorSpy = vi.fn();
    const onValueSpy = vi.fn();
    let streamCallback: any;

    const streamFunction: StreamFunction<number> = vi.fn(
      async (callback, onFail) => {
        streamCallback = callback;
        return mockStreamCloser;
      },
    );

    const mutatorError = new Error("Async mutator error");
    const streamValueMutator = vi.fn(async (value: number) => {
      if (value === 2) {
        throw mutatorError;
      }
      return value * 10;
    });

    const options: StreamOptions<number, number> = {
      onError: onErrorSpy,
      onValue: onValueSpy,
    };

    const stream = await createStream(
      streamFunction,
      streamValueMutator,
      options,
    );

    // Simulate receiving values
    streamCallback(null, 1); // Should work
    streamCallback(null, 2); // Should cause async mutator error
    streamCallback(null, 3); // Should work

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify async mutator worked for valid values
    expect(onValueSpy).toHaveBeenCalledWith(10);
    expect(onValueSpy).toHaveBeenCalledWith(30);
    expect(onValueSpy).toHaveBeenCalledTimes(2);

    // Verify async mutator error was passed to onError
    expect(onErrorSpy).toHaveBeenCalledWith(mutatorError);
  });
});
