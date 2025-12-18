import { ContentTypeText } from "@xmtp/content-type-text";
import { Dm, type Client } from "@xmtp/node-sdk";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { MessageContext } from "@/core/MessageContext.js";
import {
  createMockMessage,
  expectMessage,
  makeClient,
} from "@/util/TestUtil.js";
import { CommandRouter } from "./CommandRouter.js";

describe("CommandRouter", () => {
  const mockClient = makeClient();

  describe("types", () => {
    it("types the message content as string in command handlers", () => {
      const router = new CommandRouter();
      router.command("/test", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<string>();
      });
    });
  });

  describe("command arguments", () => {
    const mockDm = Object.create(Dm.prototype) as Dm;

    it("should pass only arguments to the handler, not the command itself", async () => {
      const router = new CommandRouter();
      const handler = vi.fn();
      router.command("/tx", handler);

      const message = createMockMessage({
        id: "test-message",
        senderInboxId: "sender-inbox-id",
        contentType: ContentTypeText,
        content: "/tx 0.1",
      });

      const ctx = new MessageContext<string>({
        message,
        conversation: mockDm,
        client: mockClient as unknown as Client<string>,
      });

      await router.handle(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining(
          expectMessage({
            content: "0.1",
          }),
        ),
      );
    });

    it("should pass empty string for commands without arguments", async () => {
      const router = new CommandRouter();
      const handler = vi.fn();
      router.command("/balance", handler);

      const message = createMockMessage({
        id: "test-message",
        senderInboxId: "sender-inbox-id",
        contentType: ContentTypeText,
        content: "/balance",
      });

      const ctx = new MessageContext<string>({
        message,
        conversation: mockDm,
        client: mockClient as unknown as Client<string>,
      });

      await router.handle(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining(
          expectMessage({
            content: "",
          }),
        ),
      );
    });

    it("should preserve multiple arguments with spaces", async () => {
      const router = new CommandRouter();
      const handler = vi.fn();
      router.command("/send", handler);

      const message = createMockMessage({
        id: "test-message",
        senderInboxId: "sender-inbox-id",
        contentType: ContentTypeText,
        content: "/send 5 USDC to Alix",
      });

      const ctx = new MessageContext<string>({
        message,
        conversation: mockDm,
        client: mockClient as unknown as Client<string>,
      });

      await router.handle(ctx);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining(
          expectMessage({
            content: "5 USDC to Alix",
          }),
        ),
      );
    });
  });
});
