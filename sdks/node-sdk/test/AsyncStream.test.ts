import { describe, expect, it } from "vitest";
import { AsyncStream } from "@/AsyncStream";

const testError = new Error("test");

describe("AsyncStream", () => {
  it("should return values from callbacks", async () => {
    const stream = new AsyncStream<number>();
    let onReturnCalled = false;
    stream.onReturn = () => {
      onReturnCalled = true;
    };
    stream.callback(null, 1);
    stream.callback(null, 2);
    stream.callback(null, 3);

    let count = 0;

    for await (const value of stream) {
      if (count === 0) {
        expect(value).toBe(1);
      }
      if (count === 1) {
        expect(value).toBe(2);
      }
      if (count === 2) {
        expect(value).toBe(3);
        break;
      }
      count++;
    }
    expect(onReturnCalled).toBe(true);
  });

  it("should catch an error thrown in the for..await loop", async () => {
    const stream = new AsyncStream<number>();
    let onReturnCalled = false;
    stream.onReturn = () => {
      onReturnCalled = true;
    };
    stream.callback(null, 1);

    try {
      for await (const value of stream) {
        expect(value).toBe(1);
        throw testError;
      }
    } catch (error) {
      expect(error).toBe(testError);
      expect((error as Error).message).toBe("test");
    }
    expect(onReturnCalled).toBe(true);
  });

  it("should catch an error passed to callback", async () => {
    const runTest = async () => {
      const stream = new AsyncStream<number>();
      let onReturnCalled = false;
      stream.onReturn = () => {
        onReturnCalled = true;
      };
      stream.callback(testError, 1);
      try {
        for await (const _value of stream) {
          // this block should never be reached
        }
      } catch (error) {
        expect(error).toBe(testError);
        expect((error as Error).message).toBe("test");
      }
      expect(onReturnCalled).toBe(true);
    };

    await expect(runTest()).rejects.toThrow(testError);
  });
});
