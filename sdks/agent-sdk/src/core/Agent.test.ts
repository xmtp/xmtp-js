import { GroupUpdated } from "@xmtp/content-type-group-updated";
import { Reply, ReplyCodec } from "@xmtp/content-type-reply";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSigner, createUser } from "../utils/user";
import { Agent } from "./Agent";

describe("Agent", () => {
  describe("types", () => {
    it("infers additional content types from codecs", async () => {
      const user = createUser();
      const signer = createSigner(user);
      const agent = await Agent.create(signer, {
        env: "dev",
        codecs: [new ReplyCodec()],
      });
      expect(agent).toBeDefined();
      expectTypeOf(agent).toEqualTypeOf<Agent<string | Reply | GroupUpdated>>();
    });
  });
});
