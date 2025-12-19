import { describe, expect, it, vi } from "vitest";
import { StreamFailedError } from "@/utils/errors";
import { createStream } from "@/utils/streams";

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
});
