import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

describe("conversations hmac-keys", () => {
  it("returns HMAC keys for conversations", async () => {
    const sender = await createRegisteredIdentity();
    const member = await createRegisteredIdentity();

    // Create a group to have some conversations
    const groupResult = await runWithIdentity(sender, [
      "conversations",
      "create-group",
      member.address,
      "--json",
    ]);
    expect(groupResult.exitCode).toBe(0);

    const result = await runWithIdentity(sender, [
      "conversations",
      "hmac-keys",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    // Output is a record of conversation ID to HMAC keys
    const output = parseJsonOutput<Record<string, unknown[]>>(result.stdout);
    expect(typeof output).toBe("object");
  });
});
