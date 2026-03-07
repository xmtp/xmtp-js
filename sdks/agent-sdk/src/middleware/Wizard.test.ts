import { describe, expect, it, vi } from "vitest";
import type { DecodedMessageWithContent } from "@/core/filter";
import { MessageContext } from "@/core/MessageContext";
import { Wizard } from "@/middleware/Wizard";

function createMockMessage(
  content: unknown,
  contentType: { authorityId: string; typeId: string },
) {
  return {
    id: `msg-${Date.now()}`,
    conversationId: "conv-1",
    senderInboxId: "sender-1",
    content,
    contentType: {
      ...contentType,
      versionMajor: 1,
      versionMinor: 0,
    },
  } as unknown as DecodedMessageWithContent;
}

function createTextMessage(text: string) {
  return createMockMessage(text, {
    authorityId: "xmtp.org",
    typeId: "text",
  });
}

function createIntentMessage(actionId: string, id = "wizard_step") {
  return createMockMessage(
    { id, actionId },
    { authorityId: "coinbase.com", typeId: "intent" },
  );
}

const mockConversation = {
  id: "conv-1",
  sendActions: vi.fn().mockResolvedValue(""),
  sendText: vi.fn().mockResolvedValue(""),
};

const mockClient = {} as any;

function createCtx(message: DecodedMessageWithContent) {
  return new MessageContext({
    message,
    conversation: mockConversation as any,
    client: mockClient,
  });
}

describe("Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("builder API", () => {
    it("supports chaining select, text, onComplete, and onCancel", () => {
      const wizard = new Wizard("test")
        .select("step1", {
          description: "Pick one",
          actions: [{ id: "a", label: "A" }],
        })
        .text("step2", { description: "Enter value" })
        .onComplete(vi.fn())
        .onCancel(vi.fn());

      expect(wizard).toBeInstanceOf(Wizard);
    });
  });

  describe("start", () => {
    it("sends the first select step as actions with a cancel button", async () => {
      const wizard = new Wizard("setup").select("provider", {
        description: "Select provider",
        actions: [
          { id: "openai", label: "OpenAI" },
          { id: "anthropic", label: "Anthropic" },
        ],
      });

      await wizard.start(createCtx(createTextMessage("trigger")));

      expect(mockConversation.sendActions).toHaveBeenCalledWith({
        id: "setup_provider",
        description: "Select provider",
        actions: [
          { id: "openai", label: "OpenAI" },
          { id: "anthropic", label: "Anthropic" },
          { id: "__wizard_cancel__", label: "Cancel" },
        ],
      });
      expect(wizard.isActive("conv-1", "sender-1")).toBe(true);
    });

    it("sends the first text step as a text message", async () => {
      const wizard = new Wizard("setup").text("username", {
        description: "Enter your username:",
      });

      await wizard.start(createCtx(createTextMessage("trigger")));

      expect(mockConversation.sendText).toHaveBeenCalledWith(
        "Enter your username:",
      );
      expect(wizard.isActive("conv-1", "sender-1")).toBe(true);
    });
  });

  describe("middleware", () => {
    it("passes through when no wizard session is active", async () => {
      const wizard = new Wizard("setup").select("step1", {
        description: "Pick",
        actions: [{ id: "a", label: "A" }],
      });

      const next = vi.fn();
      await wizard.middleware()(createCtx(createTextMessage("hello")), next);

      expect(next).toHaveBeenCalled();
    });

    it("passes through non-matching message types during a select step", async () => {
      const wizard = new Wizard("setup").select("step1", {
        description: "Pick",
        actions: [{ id: "a", label: "A" }],
      });

      await wizard.start(createCtx(createTextMessage("trigger")));

      const next = vi.fn();
      await wizard.middleware()(
        createCtx(createTextMessage("random text")),
        next,
      );

      expect(next).toHaveBeenCalled();
    });
  });

  describe("full flow", () => {
    it("completes a multi-step wizard through intents and text", async () => {
      const completeHandler = vi.fn();
      const wizard = new Wizard("api-setup")
        .select("provider", {
          description: "Select your AI provider",
          actions: [
            { id: "openai", label: "OpenAI" },
            { id: "anthropic", label: "Anthropic" },
          ],
        })
        .text("username", { description: "Enter your username:" })
        .text("password", { description: "Enter your password:" })
        .onComplete(completeHandler);

      const mw = wizard.middleware();

      // Start the wizard
      await wizard.start(createCtx(createTextMessage("trigger")));
      expect(wizard.isActive("conv-1", "sender-1")).toBe(true);

      // Step 1: User selects "openai" via intent
      await mw(
        createCtx(createIntentMessage("openai", "api-setup_provider")),
        vi.fn(),
      );

      expect(mockConversation.sendText).toHaveBeenCalledWith(
        "Enter your username:",
      );

      // Step 2: User enters username
      await mw(createCtx(createTextMessage("john_doe")), vi.fn());

      expect(mockConversation.sendText).toHaveBeenCalledWith(
        "Enter your password:",
      );

      // Step 3: User enters password
      await mw(createCtx(createTextMessage("s3cret")), vi.fn());

      expect(completeHandler).toHaveBeenCalledTimes(1);
      const [answers] = completeHandler.mock.calls[0];
      expect(answers).toEqual({
        provider: "openai",
        username: "john_doe",
        password: "s3cret",
      });
      expect(wizard.isActive("conv-1", "sender-1")).toBe(false);
    });

    it("cancels on select step when cancel button is pressed", async () => {
      const cancelHandler = vi.fn();
      const completeHandler = vi.fn();

      const wizard = new Wizard("setup")
        .select("provider", {
          description: "Select provider",
          actions: [{ id: "openai", label: "OpenAI" }],
        })
        .onComplete(completeHandler)
        .onCancel(cancelHandler);

      const mw = wizard.middleware();

      await wizard.start(createCtx(createTextMessage("trigger")));
      expect(wizard.isActive("conv-1", "sender-1")).toBe(true);

      // Press cancel
      await mw(
        createCtx(createIntentMessage("__wizard_cancel__", "setup_provider")),
        vi.fn(),
      );

      expect(cancelHandler).toHaveBeenCalledTimes(1);
      expect(completeHandler).not.toHaveBeenCalled();
      expect(wizard.isActive("conv-1", "sender-1")).toBe(false);
    });

    it("cancels via intent during a text step", async () => {
      const cancelHandler = vi.fn();

      const wizard = new Wizard("setup")
        .text("username", { description: "Enter username:" })
        .onCancel(cancelHandler);

      const mw = wizard.middleware();

      await wizard.start(createCtx(createTextMessage("trigger")));
      expect(wizard.isActive("conv-1", "sender-1")).toBe(true);

      // Send cancel intent
      await mw(
        createCtx(createIntentMessage("__wizard_cancel__", "setup_username")),
        vi.fn(),
      );

      expect(cancelHandler).toHaveBeenCalledTimes(1);
      expect(wizard.isActive("conv-1", "sender-1")).toBe(false);
    });

    it("tracks separate sessions per sender in the same conversation", async () => {
      const completeHandler = vi.fn();
      const wizard = new Wizard("setup")
        .text("name", { description: "Enter name:" })
        .onComplete(completeHandler);

      const mw = wizard.middleware();

      // Sender 1 starts
      await wizard.start(createCtx(createTextMessage("trigger")));
      expect(wizard.isActive("conv-1", "sender-1")).toBe(true);

      // Sender 2 starts (different senderInboxId)
      const sender2Msg = {
        ...createTextMessage("trigger"),
        senderInboxId: "sender-2",
      } as unknown as DecodedMessageWithContent;
      await wizard.start(
        new MessageContext({
          message: sender2Msg,
          conversation: mockConversation as any,
          client: mockClient,
        }),
      );
      expect(wizard.isActive("conv-1", "sender-2")).toBe(true);

      // Sender 1 completes
      await mw(createCtx(createTextMessage("Alice")), vi.fn());

      expect(completeHandler).toHaveBeenCalledTimes(1);
      expect(wizard.isActive("conv-1", "sender-1")).toBe(false);
      // Sender 2 still active
      expect(wizard.isActive("conv-1", "sender-2")).toBe(true);
    });
  });
});
