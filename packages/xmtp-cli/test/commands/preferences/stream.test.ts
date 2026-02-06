import { describe, expect, it } from "vitest";
import { createRegisteredIdentity, runWithIdentity } from "../../helpers.js";

describe("preferences stream", () => {
  it("streams with timeout and exits cleanly", async () => {
    const user = await createRegisteredIdentity();

    const result = await runWithIdentity(
      user,
      ["preferences", "stream", "--timeout", "2", "--json"],
      { timeout: 10000 },
    );

    // Should exit cleanly after timeout
    expect(result.exitCode).toBe(0);
  });
});
