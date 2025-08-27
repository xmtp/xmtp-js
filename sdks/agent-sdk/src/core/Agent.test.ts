// filepath: /home/bennycode/dev/xmtp/xmtp-js/sdks/agent-sdk/src/core/Agent.test.ts
import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { ReplyCodec, type Reply } from "@xmtp/content-type-reply";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSigner, createUser } from "@/utils/user";
import { Agent } from "./Agent";
import { AgentContext } from "./AgentContext";

describe("Agent", async () => {
  const user = createUser();
  const signer = createSigner(user);
  const agent = await Agent.create(signer, {
    env: "dev",
    dbPath: null,
    codecs: [new ReplyCodec()],
  });

  describe("types", () => {
    it("infers additional content types from given codecs", async () => {
      expectTypeOf(agent).toEqualTypeOf<Agent<string | Reply | GroupUpdated>>();
    });

    it("types the content in message event listener", async () => {
      agent.on("message", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<
          AgentContext<string | Reply | GroupUpdated>
        >();
      });
    });
  });
});
