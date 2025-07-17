import { describe, expect, it, vi } from "vitest";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe("Streams", () => {
  it("should call onFail when the stream fails", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const onFail = vi.fn();
    const stream = await client.conversations.streamAllMessages(
      undefined,
      undefined,
      undefined,
      onFail,
    );
    console.log("waiting for messages...");
    for await (const message of stream) {
      expect(message).toBeDefined();
    }
    console.log("stream ended");
    expect(onFail).toHaveBeenCalledOnce();
  });
});
