import { type BuiltInContentTypes, type Client } from "@xmtp/node-sdk";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { Agent } from "@/core/Agent";
import type { DecodedMessageWithContent } from "@/core/filter";
import { MessageContext } from "@/core/MessageContext";
import { CommandRouter } from "@/middleware/CommandRouter";
import { createClient } from "@/util/test";

describe("CommandRouter", () => {
  let agent: Agent<BuiltInContentTypes>;
  let client: Client;

  beforeEach(async () => {
    client = await createClient();
    agent = new Agent({
      client,
    });
  });

  describe("types", () => {
    it("types the message content as string in command handlers", () => {
      const router = new CommandRouter();
      router.command("/test", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<string>();
      });
    });
  });

  describe("command arguments", () => {
    it("should pass only arguments to the handler, not the command itself", async () => {
      const router = new CommandRouter();
      const handler = vi.fn();
      router.command("/tx", handler);

      agent.use(router.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      const messageId = await dm.sendText("/tx 0.1");
      const message = otherClient.conversations.getMessageById(
        messageId,
      )! as DecodedMessageWithContent<string>;

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      expect(handler).toHaveBeenCalledWith(
        new MessageContext({
          message,
          conversation: dm,
          client: otherClient,
        }),
      );
    });

    it("should pass empty string for commands without arguments", async () => {
      const router = new CommandRouter();
      const handler = vi.fn();
      router.command("/balance", handler);

      agent.use(router.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      const messageId = await dm.sendText("/balance");
      const message = otherClient.conversations.getMessageById(
        messageId,
      )! as DecodedMessageWithContent<string>;

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      expect(handler).toHaveBeenCalledWith(
        new MessageContext({
          message,
          conversation: dm,
          client: otherClient,
        }),
      );
    });

    it("should preserve multiple arguments with spaces", async () => {
      const router = new CommandRouter();
      const handler = vi.fn();
      router.command("/send", handler);

      agent.use(router.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      const messageId = await dm.sendText("/send 5 USDC to Alix");
      const message = otherClient.conversations.getMessageById(
        messageId,
      )! as DecodedMessageWithContent<string>;

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      expect(handler).toHaveBeenCalledWith(
        new MessageContext({
          message,
          conversation: dm,
          client: otherClient,
        }),
      );
    });
  });

  describe("commandList", () => {
    it("returns an empty array when no commands are registered", () => {
      const router = new CommandRouter();
      expect(router.commandList).toEqual([]);
    });

    it("returns commands in lowercase as they are stored", () => {
      const router = new CommandRouter();
      router.command("/HELP", vi.fn());
      router.command("/Balance", vi.fn());
      expect(router.commandList).toEqual(["/help", "/balance"]);
    });

    it("does not include the default handler in the command list", () => {
      const router = new CommandRouter();
      router.command("/help", vi.fn());
      router.default(vi.fn());
      expect(router.commandList).toEqual(["/help"]);
    });
  });
});
