import { describe, expect, it } from "vitest";
import { shouldIgnoreError } from "./sentry";

describe("shouldIgnoreError", () => {
  it("ignores runtime.sendMessage errors", () => {
    expect(
      shouldIgnoreError(
        new Error(
          "Error in invocation of runtime.sendMessage: No matching signature.",
        ),
      ),
    ).toBe(true);
  });

  it("ignores runtime.sendMessage strings", () => {
    expect(
      shouldIgnoreError("Error in invocation of runtime.sendMessage"),
    ).toBe(true);
  });

  it("does not ignore unrelated errors", () => {
    expect(shouldIgnoreError(new Error("Unable to connect"))).toBe(false);
  });
});
