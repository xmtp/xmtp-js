import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNameResolver } from "./NameResolver.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("NameResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("caching behavior", () => {
    it("should return address immediately without API call for valid addresses", async () => {
      const nameResolver = createNameResolver();
      const validAddress = "0x1234567890123456789012345678901234567890";

      const result = await nameResolver(validAddress);
      expect(result).toBe(validAddress);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should cache resolved names and not make duplicate API calls", async () => {
      const mockResponse = [
        { address: "0x1234567890123456789012345678901234567890" },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const nameResolver = createNameResolver();
      const testName = "test.eth";

      const firstRequest = await nameResolver(testName);
      expect(firstRequest).toBe("0x1234567890123456789012345678901234567890");
      expect(
        mockFetch,
        "First call should make an API request",
      ).toHaveBeenCalledTimes(1);

      const secondRequest = await nameResolver(testName);
      expect(secondRequest).toBe("0x1234567890123456789012345678901234567890");
      expect(mockFetch, "Still only 1 call").toHaveBeenCalledTimes(1);
    });
  });
});
