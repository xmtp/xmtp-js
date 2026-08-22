import { describe, expect, it, vi } from "vitest";
import { StreamFailedError } from "@/utils/errors";
import {
  createStream,
  type StreamCallback,
  type StreamFunction,
} from "@/utils/streams";

describe("createStream", () => {
  it("should forward StreamFailedError to onError", async () => {
    const onErrorSpy = vi.fn();
    const onFailSpy = vi.fn();

    const mockStreamFunction = vi.fn(async (_, onFail: () => void) => {
      // Simulate immediate stream failure
      setTimeout(() => {
        onFail();
      }, 0);
      return Promise.resolve({
        end: vi.fn(),
        endAndWait: vi.fn().mockResolvedValue(undefined),
        isClosed: vi.fn().mockReturnValue(false),
        waitForReady: vi.fn().mockResolvedValue(undefined),
      });
    });

    const stream = await createStream(mockStreamFunction, undefined, {
      onError: onErrorSpy,
      onFail: onFailSpy,
      retryOnFail: false,
    });

    setTimeout(() => {
      void stream.end();
    }, 100);

    // Wait for the failure to be processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onErrorSpy).toHaveBeenCalledWith(expect.any(StreamFailedError));
  });

  it("should call onEnd and streamCloser.end when stream ends", async () => {
    const onEndSpy = vi.fn();
    const closerEndSpy = vi.fn();

    const mockStreamFunction: StreamFunction<number> = vi.fn(
      async (callback: StreamCallback<number>) => {
        callback(null, 1);
        return Promise.resolve({
          end: closerEndSpy,
          endAndWait: vi.fn().mockResolvedValue(undefined),
          isClosed: vi.fn().mockReturnValue(false),
          waitForReady: vi.fn().mockResolvedValue(undefined),
        });
      },
    );

    const stream = await createStream(mockStreamFunction, undefined, {
      onEnd: onEndSpy,
    });

    await stream.end();

    expect(closerEndSpy).toHaveBeenCalledTimes(1);
    expect(onEndSpy).toHaveBeenCalledTimes(1);
  });

  it("should emit values and invoke onValue callback", async () => {
    const values: number[] = [];
    const onValueSpy = vi.fn<(value: number) => void>();

    const mockStreamFunction: StreamFunction<number> = vi.fn(
      async (callback: StreamCallback<number>) => {
        callback(null, 1);
        callback(null, 2);
        return Promise.resolve({
          end: vi.fn(),
          endAndWait: vi.fn().mockResolvedValue(undefined),
          isClosed: vi.fn().mockReturnValue(false),
          waitForReady: vi.fn().mockResolvedValue(undefined),
        });
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
    expect(onValueSpy).toHaveBeenCalledWith(1);
    expect(onValueSpy).toHaveBeenCalledWith(2);
  });

  it("should call onEnd and streamCloser.end after successful retry", async () => {
    const onEndSpy = vi.fn();
    const closerEndSpy = vi.fn();
    let callCount = 0;

    const mockStreamFunction: StreamFunction<number> = vi.fn(
      async (callback: StreamCallback<number>) => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Initial failure");
        }
        callback(null, 42);
        return Promise.resolve({
          end: closerEndSpy,
          endAndWait: vi.fn().mockResolvedValue(undefined),
          isClosed: vi.fn().mockReturnValue(false),
          waitForReady: vi.fn().mockResolvedValue(undefined),
        });
      },
    );

    const stream = await createStream(mockStreamFunction, undefined, {
      onEnd: onEndSpy,
      retryOnFail: true,
      retryDelay: 10,
      retryAttempts: 3,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    await stream.end();

    expect(closerEndSpy).toHaveBeenCalledTimes(1);
    expect(onEndSpy).toHaveBeenCalledTimes(1);
  });
});
