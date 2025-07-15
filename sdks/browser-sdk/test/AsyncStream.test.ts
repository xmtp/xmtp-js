import { describe, expect, it, vi } from "vitest";
import { AsyncStream } from "@/AsyncStream";

const testError = new Error("test");

describe("AsyncStream", () => {
  it("should return values from callbacks in sequence", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();
    const onDoneSpy = vi.fn();
    const onErrorSpy = vi.fn();

    stream.onReturn = onReturnSpy;
    stream.onDone = onDoneSpy;
    stream.onError = onErrorSpy;

    void stream.callback(null, 1);
    void stream.callback(null, 2);
    void stream.callback(null, 3);
    void stream.callback(null, 4);
    void stream.callback(null, 5);

    const values: (number | Error | undefined)[] = [];
    let iterationCount = 0;

    for await (const value of stream) {
      values.push(value);
      iterationCount++;

      if (iterationCount === 3) {
        break;
      }
    }

    expect(values).toEqual([1, 2, 3]);
    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onErrorSpy).not.toHaveBeenCalled();
    expect(stream.isDone).toBe(true);
    expect(stream.error).toBeUndefined();
  });

  it("should handle values added during iteration", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();
    const onDoneSpy = vi.fn();
    const onErrorSpy = vi.fn();

    stream.onReturn = onReturnSpy;
    stream.onDone = onDoneSpy;
    stream.onError = onErrorSpy;

    void stream.callback(null, 1);

    const values: (number | Error | undefined)[] = [];
    let iterationCount = 0;

    for await (const value of stream) {
      values.push(value);
      iterationCount++;

      if (iterationCount === 1) {
        void stream.callback(null, 2);
        void stream.callback(null, 3);
      }

      if (iterationCount === 3) {
        break;
      }
    }

    expect(values).toEqual([1, 2, 3]);
    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onErrorSpy).not.toHaveBeenCalled();
    expect(stream.isDone).toBe(true);
  });

  it("should catch an error thrown in the for..await loop and cleanup properly", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();
    const onDoneSpy = vi.fn();
    const onErrorSpy = vi.fn();

    stream.onReturn = onReturnSpy;
    stream.onDone = onDoneSpy;
    stream.onError = onErrorSpy;
    void stream.callback(null, 1);
    void stream.callback(null, 2);

    try {
      for await (const value of stream) {
        expect(value).toBe(1);
        throw testError;
      }
    } catch (error) {
      expect(error).toBe(testError);
    }

    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onErrorSpy).not.toHaveBeenCalled();
    expect(stream.isDone).toBe(true);
    expect(stream.error).toBeUndefined();
  });

  it("should catch an error passed to callback and cleanup properly", async () => {
    const stream = new AsyncStream<number>();
    const onErrorSpy = vi.fn();
    const onDoneSpy = vi.fn();
    const onReturnSpy = vi.fn();

    stream.onError = onErrorSpy;
    stream.onDone = onDoneSpy;
    stream.onReturn = onReturnSpy;

    void stream.callback(null, 1);
    void stream.callback(testError, 2);

    const values: (number | Error)[] = [];

    try {
      for await (const value of stream) {
        values.push(value!);
      }
    } catch (error) {
      expect(error).toBe(testError);
    }

    expect(values).toEqual([1]);
    expect(onErrorSpy).toHaveBeenCalledOnce();
    expect(onErrorSpy).toHaveBeenCalledWith(testError);
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onReturnSpy).not.toHaveBeenCalled();
    expect(stream.isDone).toBe(true);
    expect(stream.error).toBe(testError);
  });

  it("should catch an error passed to callback (delayed) and handle pending promises", async () => {
    const stream = new AsyncStream<number>();
    const onErrorSpy = vi.fn();
    const onDoneSpy = vi.fn();
    const onReturnSpy = vi.fn();

    stream.onError = onErrorSpy;
    stream.onDone = onDoneSpy;
    stream.onReturn = onReturnSpy;

    setTimeout(() => {
      void stream.callback(testError, 1);
    }, 100);

    try {
      for await (const _value of stream) {
        // this block should never be reached
        expect(true).toBe(false); // Should not reach here
      }
    } catch (error) {
      expect(error).toBe(testError);
    }

    expect(onErrorSpy).toHaveBeenCalledOnce();
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onReturnSpy).not.toHaveBeenCalled();
    expect(stream.isDone).toBe(true);
    expect(stream.error).toBe(testError);
  });

  it("should end for await..of loop when stream is ended and call onDone", async () => {
    const stream = new AsyncStream<number>();
    const onDoneSpy = vi.fn();
    const onReturnSpy = vi.fn();

    stream.onDone = onDoneSpy;
    stream.onReturn = onReturnSpy;

    void stream.callback(null, 1);
    void stream.callback(null, 2);

    setTimeout(() => {
      void stream.end();
    }, 100);

    const values: (number | Error | undefined)[] = [];

    for await (const value of stream) {
      values.push(value);
    }

    expect(values).toEqual([1, 2]);
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);
    expect(stream.error).toBeUndefined();
  });

  it("should handle multiple concurrent next() calls", async () => {
    const stream = new AsyncStream<number>();

    const nextPromise1 = stream.next();
    const nextPromise2 = stream.next();
    const nextPromise3 = stream.next();

    void stream.callback(null, 1);
    void stream.callback(null, 2);
    void stream.callback(null, 3);

    const [result1, result2, result3] = await Promise.all([
      nextPromise1,
      nextPromise2,
      nextPromise3,
    ]);

    expect(result1).toEqual({ done: false, value: 1 });
    expect(result2).toEqual({ done: false, value: 2 });
    expect(result3).toEqual({ done: false, value: 3 });
    expect(stream.isDone).toBe(false);
  });

  it("should handle next() calls after stream is done", async () => {
    const stream = new AsyncStream<number>();

    void stream.callback(null, 1);
    await stream.end();

    const result1 = await stream.next();
    const result2 = await stream.next();

    expect(result1).toEqual({ done: true, value: undefined });
    expect(result2).toEqual({ done: true, value: undefined });
    expect(stream.isDone).toBe(true);
  });

  it("should handle error with pending promises", async () => {
    const stream = new AsyncStream<number>();
    const onErrorSpy = vi.fn();
    const onReturnSpy = vi.fn();
    const onDoneSpy = vi.fn();

    stream.onReturn = onReturnSpy;
    stream.onError = onErrorSpy;
    stream.onDone = onDoneSpy;

    const nextPromise1 = stream.next();
    const nextPromise2 = stream.next();
    const nextPromise3 = stream.next();

    void stream.callback(testError, 1);

    await expect(nextPromise1).rejects.toBe(testError);

    const result2 = await nextPromise2;
    expect(result2).toEqual({ done: true, value: undefined });

    const result3 = await nextPromise3;
    expect(result3).toEqual({ done: true, value: undefined });

    expect(onErrorSpy).toHaveBeenCalledOnce();
    expect(onReturnSpy).not.toHaveBeenCalled();
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);
    expect(stream.error).toBe(testError);
  });

  it("should handle return() with pending promises", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();

    stream.onReturn = onReturnSpy;

    const nextPromise1 = stream.next();
    const nextPromise2 = stream.next();

    const returnResult = await stream.return(42);

    expect(returnResult).toEqual({ done: true, value: 42 });
    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);

    const result1 = await nextPromise1;
    const result2 = await nextPromise2;

    expect(result1).toEqual({ done: true, value: 42 });
    expect(result2).toEqual({ done: true, value: 42 });
  });

  it("should not process callbacks after being done", async () => {
    const stream = new AsyncStream<number>();
    const onErrorSpy = vi.fn();
    const onDoneSpy = vi.fn();
    const onReturnSpy = vi.fn();

    stream.onError = onErrorSpy;
    stream.onDone = onDoneSpy;
    stream.onReturn = onReturnSpy;

    // End the stream
    await stream.end();

    // These callbacks should be ignored
    void stream.callback(null, 1);
    void stream.callback(testError, 2);

    for await (const _value of stream) {
      // this block should never be reached
      expect(false).toBe(true);
    }

    expect(stream.isDone).toBe(true);
    expect(stream.error).toBeUndefined();
    expect(onErrorSpy).not.toHaveBeenCalled();
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onReturnSpy).toHaveBeenCalledOnce();

    const result = await stream.next();
    expect(result).toEqual({ done: true, value: undefined });
  });

  it("should handle queue properly when values arrive faster than consumption", async () => {
    const stream = new AsyncStream<number>();

    for (let i = 1; i <= 5; i++) {
      void stream.callback(null, i);
    }

    const values: (number | Error | undefined)[] = [];

    for (let i = 0; i < 3; i++) {
      const result = await stream.next();
      expect(result.done).toBe(false);
      values.push(result.value);
    }

    expect(values).toEqual([1, 2, 3]);
    expect(stream.isDone).toBe(false);

    await stream.end();

    const finalResult = await stream.next();
    expect(finalResult).toEqual({ done: true, value: undefined });
  });
});
