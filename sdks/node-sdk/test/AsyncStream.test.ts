import { describe, expect, it, vi } from "vitest";
import { AsyncStream, createAsyncStreamProxy } from "@/AsyncStream";

const testError = new Error("test");

describe("AsyncStream", () => {
  it("should return values from push() in sequence", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();
    const onDoneSpy = vi.fn();

    stream.onReturn = onReturnSpy;
    stream.onDone = onDoneSpy;

    stream.push(1);
    stream.push(2);
    stream.push(3);
    stream.push(4);
    stream.push(5);

    const values: (number | undefined)[] = [];
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
    expect(stream.isDone).toBe(true);
  });

  it("should handle values added during iteration", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();
    const onDoneSpy = vi.fn();

    stream.onReturn = onReturnSpy;
    stream.onDone = onDoneSpy;

    stream.push(1);

    const values: (number | undefined)[] = [];
    let iterationCount = 0;

    for await (const value of stream) {
      values.push(value);
      iterationCount++;

      if (iterationCount === 1) {
        stream.push(2);
        stream.push(3);
      }

      if (iterationCount === 3) {
        break;
      }
    }

    expect(values).toEqual([1, 2, 3]);
    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);
  });

  it("should catch an error thrown in the for..await loop and cleanup properly", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();
    const onDoneSpy = vi.fn();

    stream.onReturn = onReturnSpy;
    stream.onDone = onDoneSpy;
    stream.push(1);
    stream.push(2);

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
    expect(stream.isDone).toBe(true);
  });

  it("should end for await..of loop when stream is ended and call onDone", async () => {
    const stream = new AsyncStream<number>();
    const onDoneSpy = vi.fn();
    const onReturnSpy = vi.fn();

    stream.onDone = onDoneSpy;
    stream.onReturn = onReturnSpy;

    stream.push(1);
    stream.push(2);

    setTimeout(() => {
      void stream.end();
    }, 100);

    const values: (number | undefined)[] = [];

    for await (const value of stream) {
      values.push(value);
    }

    expect(values).toEqual([1, 2]);
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);

    stream.push(3);

    for await (const _value of stream) {
      // this block should never be reached
      expect(false).toBe(true);
    }
  });

  it("should handle multiple concurrent next() calls", async () => {
    const stream = new AsyncStream<number>();

    const nextPromise1 = stream.next();
    const nextPromise2 = stream.next();
    const nextPromise3 = stream.next();

    stream.push(1);
    stream.push(2);
    stream.push(3);

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

  it("should handle return() with pending promises", async () => {
    const stream = new AsyncStream<number>();
    const onReturnSpy = vi.fn();

    stream.onReturn = onReturnSpy;

    const nextPromise1 = stream.next();
    const nextPromise2 = stream.next();

    const returnResult = await stream.return();

    expect(returnResult).toEqual({ done: true, value: undefined });
    expect(onReturnSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);

    const result1 = await nextPromise1;
    const result2 = await nextPromise2;

    expect(result1).toEqual({ done: true, value: undefined });
    expect(result2).toEqual({ done: true, value: undefined });
  });

  it("should not process callbacks after being done", async () => {
    const stream = new AsyncStream<number>();
    const onDoneSpy = vi.fn();
    const onReturnSpy = vi.fn();

    stream.onDone = onDoneSpy;
    stream.onReturn = onReturnSpy;

    // End the stream
    await stream.end();

    // These callbacks should be ignored
    stream.push(1);

    for await (const _value of stream) {
      // this block should never be reached
      expect(false).toBe(true);
    }

    expect(stream.isDone).toBe(true);
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(onReturnSpy).toHaveBeenCalledOnce();

    const result = await stream.next();
    expect(result).toEqual({ done: true, value: undefined });
  });

  it("should handle queue properly when values arrive faster than consumption", async () => {
    const stream = new AsyncStream<number>();

    for (let i = 1; i <= 5; i++) {
      stream.push(i);
    }

    const values: (number | undefined)[] = [];

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

describe("createAsyncStreamProxy", () => {
  it("should only expose allowed methods and properties", () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    expect(typeof proxy.next).toBe("function");
    expect(typeof proxy.end).toBe("function");
    expect(typeof proxy.return).toBe("function");
    expect(typeof proxy[Symbol.asyncIterator]).toBe("function");

    const ownProperties = Object.getOwnPropertyNames(proxy);
    expect(ownProperties).toHaveLength(4);
    expect(ownProperties).toContain("end");
    expect(ownProperties).toContain("return");
    expect(ownProperties).toContain("isDone");
    expect(ownProperties).toContain("next");
  });

  it("should prevent setting properties", () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    // this will fail silently
    proxy.isDone = true;

    expect(proxy.isDone).toBe(false);
  });

  it("should correctly forward next() calls to the underlying stream", async () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    stream.push(1);
    stream.push(2);

    const result1 = await proxy.next();
    const result2 = await proxy.next();

    expect(result1).toEqual({ done: false, value: 1 });
    expect(result2).toEqual({ done: false, value: 2 });
  });

  it("should correctly forward end() calls to the underlying stream", async () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);
    const onDoneSpy = vi.fn();

    stream.onDone = onDoneSpy;

    const result = await proxy.end();

    expect(result).toEqual({ done: true, value: undefined });
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);
    expect(proxy.isDone).toBe(true);
  });

  it("should maintain async iterator functionality", async () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    stream.push(1);
    stream.push(2);
    stream.push(3);

    const values: number[] = [];
    let iterationCount = 0;

    for await (const value of proxy) {
      values.push(value);
      iterationCount++;

      if (iterationCount === 3) {
        break;
      }
    }

    expect(values).toEqual([1, 2, 3]);
    expect(stream.isDone).toBe(true);
    expect(proxy.isDone).toBe(true);
  });

  it("should end for await..of loop when proxy is ended and call onDone", async () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);
    const onDoneSpy = vi.fn();

    stream.onDone = onDoneSpy;

    stream.push(1);
    stream.push(2);

    setTimeout(() => {
      void proxy.end();
    }, 100);

    const values: number[] = [];

    for await (const value of proxy) {
      values.push(value);
    }

    expect(values).toEqual([1, 2]);
    expect(onDoneSpy).toHaveBeenCalledOnce();
    expect(stream.isDone).toBe(true);
    expect(proxy.isDone).toBe(true);

    stream.push(3);

    for await (const _value of proxy) {
      // this block should never be reached
      expect(false).toBe(true);
    }
  });

  it("should correctly implement has() trap", () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    expect("isDone" in proxy).toBe(true);
    expect("next" in proxy).toBe(true);
    expect("end" in proxy).toBe(true);
    expect("return" in proxy).toBe(true);
    expect(Symbol.asyncIterator in proxy).toBe(true);

    expect("push" in proxy).toBe(false);
    expect("error" in proxy).toBe(false);
    expect("onDone" in proxy).toBe(false);
    expect("onError" in proxy).toBe(false);
    expect("onReturn" in proxy).toBe(false);
    expect("nonExistentProperty" in proxy).toBe(false);
  });

  it("should correctly implement ownKeys() trap", () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    const keys = Object.getOwnPropertyNames(proxy);
    const symbols = Object.getOwnPropertySymbols(proxy);

    expect(keys).toHaveLength(4);
    expect(keys).toContain("next");
    expect(keys).toContain("end");
    expect(keys).toContain("return");
    expect(keys).toContain("isDone");
    expect(symbols).toHaveLength(1);
    expect(symbols).toContain(Symbol.asyncIterator);
  });

  it("should correctly implement getOwnPropertyDescriptor() trap", () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    const nextDescriptor = Object.getOwnPropertyDescriptor(proxy, "next");
    expect(nextDescriptor).toBeDefined();
    expect(nextDescriptor?.enumerable).toBe(true);
    expect(nextDescriptor?.configurable).toBe(true);
    expect(typeof nextDescriptor?.value).toBe("function");

    const endDescriptor = Object.getOwnPropertyDescriptor(proxy, "end");
    expect(endDescriptor).toBeDefined();
    expect(endDescriptor?.enumerable).toBe(true);
    expect(endDescriptor?.configurable).toBe(true);
    expect(typeof endDescriptor?.value).toBe("function");

    const returnDescriptor = Object.getOwnPropertyDescriptor(proxy, "return");
    expect(returnDescriptor).toBeDefined();
    expect(returnDescriptor?.enumerable).toBe(true);
    expect(returnDescriptor?.configurable).toBe(true);
    expect(typeof returnDescriptor?.value).toBe("function");

    const asyncIteratorDescriptor = Object.getOwnPropertyDescriptor(
      proxy,
      Symbol.asyncIterator,
    );
    expect(asyncIteratorDescriptor).toBeDefined();
    expect(asyncIteratorDescriptor?.enumerable).toBe(true);
    expect(asyncIteratorDescriptor?.configurable).toBe(true);
    expect(typeof asyncIteratorDescriptor?.value).toBe("function");

    // Non-exposed properties should return undefined
    const callbackDescriptor = Object.getOwnPropertyDescriptor(
      proxy,
      "callback",
    );
    expect(callbackDescriptor).toBeUndefined();

    const isDoneDescriptor = Object.getOwnPropertyDescriptor(proxy, "isDone");
    expect(isDoneDescriptor).toBeDefined();
    expect(isDoneDescriptor?.enumerable).toBe(true);
    expect(isDoneDescriptor?.configurable).toBe(true);
    expect(typeof isDoneDescriptor?.value).toBe("boolean");
  });

  it("should handle concurrent operations through proxy", async () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    const nextPromise1 = proxy.next();
    const nextPromise2 = proxy.next();
    const nextPromise3 = proxy.next();

    stream.push(1);
    stream.push(2);
    stream.push(3);

    const [result1, result2, result3] = await Promise.all([
      nextPromise1,
      nextPromise2,
      nextPromise3,
    ]);

    expect(result1).toEqual({ done: false, value: 1 });
    expect(result2).toEqual({ done: false, value: 2 });
    expect(result3).toEqual({ done: false, value: 3 });
  });

  it("should work correctly when stream is already done", async () => {
    const stream = new AsyncStream<number>();
    const proxy = createAsyncStreamProxy(stream);

    stream.push(1);
    await proxy.end();

    const result1 = await proxy.next();
    const result2 = await proxy.next();

    expect(result1).toEqual({ done: true, value: undefined });
    expect(result2).toEqual({ done: true, value: undefined });
  });
});
