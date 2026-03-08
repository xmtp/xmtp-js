import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MessageContext } from "@/core/MessageContext";
import { ActionWizard } from "@/middleware/ActionWizard";

function createTextMessage(content: string, senderInboxId = "sender-1") {
  return {
    content,
    senderInboxId,
    contentType: { authorityId: "xmtp.org", typeId: "text" },
  };
}

function createIntentMessage(actionId: string, senderInboxId = "sender-1") {
  return {
    content: { actionId },
    senderInboxId,
    contentType: { authorityId: "coinbase.com", typeId: "intent" },
  };
}

function createMockConversation(id = "conv-1") {
  return {
    id,
    sendText: vi.fn(),
    sendActions: vi.fn(),
  };
}

function createMockCtx(overrides: {
  message: ReturnType<typeof createTextMessage | typeof createIntentMessage>;
  conversation?: ReturnType<typeof createMockConversation>;
  client?: unknown;
}) {
  const conversation = overrides.conversation ?? createMockConversation();
  return {
    message: overrides.message,
    conversation,
    client: overrides.client ?? {
      conversations: { createDm: vi.fn() },
    },
  } as unknown as MessageContext<unknown, unknown>;
}

describe("ActionWizard", () => {
  describe("static helpers", () => {
    it("builds a session", () => {
      expect(ActionWizard.sessionKey("conv-1", "sender-1")).toBe(
        "conv-1:sender-1",
      );
    });

    it("builds a step key", () => {
      expect(ActionWizard.stepKey("setup", "color")).toBe("setup:color");
    });
  });

  describe("Builder API", () => {
    it("returns this from select() for chaining", () => {
      const wizard = new ActionWizard("w");
      const result = wizard.select("s", {
        description: "Pick",
        actions: [{ id: "a", label: "A" }],
      });
      expect(result).toBe(wizard);
    });

    it("returns this from text() for chaining", () => {
      const wizard = new ActionWizard("w");
      const result = wizard.text("t", { description: "Enter name" });
      expect(result).toBe(wizard);
    });

    it("returns this from onComplete() for chaining", () => {
      const wizard = new ActionWizard("w");
      const result = wizard.onComplete(vi.fn());
      expect(result).toBe(wizard);
    });

    it("returns this from onCancel() for chaining", () => {
      const wizard = new ActionWizard("w");
      const result = wizard.onCancel(vi.fn());
      expect(result).toBe(wizard);
    });
  });

  describe("middleware", () => {
    it("returns a function", () => {
      const wizard = new ActionWizard("setup");
      expect(typeof wizard.middleware()).toBe("function");
    });

    it("calls next() when no session is active and message is unrelated", async () => {
      const wizard = new ActionWizard("setup");
      wizard.select("step1", {
        description: "Pick",
        actions: [{ id: "a", label: "A" }],
      });
      const mw = wizard.middleware();
      const next = vi.fn();
      const ctx = createMockCtx({
        message: createTextMessage("hello"),
      });
      await mw(ctx, next);
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("select step", () => {
    let wizard: ActionWizard;
    let conversation: ReturnType<typeof createMockConversation>;
    let completeHandler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      conversation = createMockConversation();
      completeHandler = vi.fn();
      wizard = new ActionWizard("setup");
      wizard
        .select("color", {
          description: "Pick a color",
          actions: [
            { id: "red", label: "Red" },
            { id: "blue", label: "Blue" },
          ],
        })
        .onComplete(completeHandler as never);
    });

    it("sends actions when the trigger command is received", async () => {
      const mw = wizard.middleware();
      const ctx = createMockCtx({
        message: createTextMessage("/setup"),
        conversation,
      });
      await mw(ctx, vi.fn());

      expect(conversation.sendActions).toHaveBeenCalledWith({
        id: "setup:color",
        description: "Pick a color",
        actions: [
          { id: "red", label: "Red" },
          { id: "blue", label: "Blue" },
        ],
      });
    });

    it("marks the session as active after the trigger command", async () => {
      const mw = wizard.middleware();
      const ctx = createMockCtx({
        message: createTextMessage("/setup"),
        conversation,
      });
      await mw(ctx, vi.fn());
      expect(wizard.isActive(conversation.id, "sender-1")).toBe(true);
    });

    it("records the answer and completes when an intent is received", async () => {
      const mw = wizard.middleware();

      // Start wizard
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      // Answer with intent
      const intentCtx = createMockCtx({
        message: createIntentMessage("blue"),
        conversation,
      });
      await mw(intentCtx, vi.fn());

      expect(completeHandler).toHaveBeenCalledWith(
        { color: "blue" },
        intentCtx,
      );
      expect(wizard.isActive(conversation.id, "sender-1")).toBe(false);
    });
  });

  describe("text step", () => {
    let wizard: ActionWizard;
    let conversation: ReturnType<typeof createMockConversation>;
    let completeHandler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      conversation = createMockConversation();
      completeHandler = vi.fn();
      wizard = new ActionWizard("config");
      wizard
        .text("name", { description: "Enter your name" })
        .onComplete(completeHandler as never);
    });

    it("sends the description as text when the trigger command is received", async () => {
      const mw = wizard.middleware();
      await mw(
        createMockCtx({
          message: createTextMessage("/config"),
          conversation,
        }),
        vi.fn(),
      );

      expect(conversation.sendText).toHaveBeenCalledWith("Enter your name");
    });

    it("records the answer and completes when a text reply is received", async () => {
      const mw = wizard.middleware();

      // Start wizard
      await mw(
        createMockCtx({
          message: createTextMessage("/config"),
          conversation,
        }),
        vi.fn(),
      );

      // Answer with text
      const answerCtx = createMockCtx({
        message: createTextMessage("Alice"),
        conversation,
      });
      await mw(answerCtx, vi.fn());

      expect(completeHandler).toHaveBeenCalledWith({ name: "Alice" }, answerCtx);
    });
  });

  describe("multi-step wizard", () => {
    let wizard: ActionWizard;
    let conversation: ReturnType<typeof createMockConversation>;
    let completeHandler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      conversation = createMockConversation();
      completeHandler = vi.fn();
      wizard = new ActionWizard("onboard");
      wizard
        .select("plan", {
          description: "Choose plan",
          actions: [
            { id: "free", label: "Free" },
            { id: "pro", label: "Pro" },
          ],
        })
        .text("email", { description: "Enter your email" })
        .onComplete(completeHandler as never);
    });

    it("advances through all steps and calls complete with all answers", async () => {
      const mw = wizard.middleware();

      // Start
      await mw(
        createMockCtx({
          message: createTextMessage("/onboard"),
          conversation,
        }),
        vi.fn(),
      );
      expect(conversation.sendActions).toHaveBeenCalledOnce();

      // Step 1: select plan
      await mw(
        createMockCtx({
          message: createIntentMessage("pro"),
          conversation,
        }),
        vi.fn(),
      );
      // Should send next step (text)
      expect(conversation.sendText).toHaveBeenCalledWith("Enter your email");
      expect(completeHandler).not.toHaveBeenCalled();

      // Step 2: enter email
      const finalCtx = createMockCtx({
        message: createTextMessage("user@example.com"),
        conversation,
      });
      await mw(finalCtx, vi.fn());

      expect(completeHandler).toHaveBeenCalledWith(
        { plan: "pro", email: "user@example.com" },
        finalCtx,
      );
      expect(wizard.isActive(conversation.id, "sender-1")).toBe(false);
    });
  });

  describe("cancel", () => {
    it("adds a cancel button to select steps when cancel is true", async () => {
      const conversation = createMockConversation();
      const wizard = new ActionWizard("setup", { cancel: true });
      wizard.select("color", {
        description: "Pick",
        actions: [{ id: "red", label: "Red" }],
      });

      const mw = wizard.middleware();
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      const sentActions = conversation.sendActions.mock.calls[0]![0];
      expect(sentActions.actions).toHaveLength(2);
      expect(sentActions.actions[1].label).toBe("Cancel");
    });

    it("uses a custom cancel label", async () => {
      const conversation = createMockConversation();
      const wizard = new ActionWizard("setup", {
        cancel: { label: "Abort" },
      });
      wizard.select("color", {
        description: "Pick",
        actions: [{ id: "red", label: "Red" }],
      });

      const mw = wizard.middleware();
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      const sentActions = conversation.sendActions.mock.calls[0]![0];
      expect(sentActions.actions[1].label).toBe("Abort");
    });

    it("calls the cancel handler when the cancel action is clicked", async () => {
      const conversation = createMockConversation();
      const cancelHandler = vi.fn();
      const wizard = new ActionWizard("setup", { cancel: true });
      wizard
        .select("color", {
          description: "Pick",
          actions: [{ id: "red", label: "Red" }],
        })
        .onCancel(cancelHandler);

      const mw = wizard.middleware();

      // Start wizard
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      // Get the cancel action ID from what was sent
      const sentActions = conversation.sendActions.mock.calls[0]![0];
      const cancelActionId = sentActions.actions[1].id;

      // Click cancel
      const cancelCtx = createMockCtx({
        message: createIntentMessage(cancelActionId),
        conversation,
      });
      await mw(cancelCtx, vi.fn());

      expect(cancelHandler).toHaveBeenCalledWith(cancelCtx);
      expect(wizard.isActive(conversation.id, "sender-1")).toBe(false);
    });

    it("does not add cancel button when cancel option is not set", async () => {
      const conversation = createMockConversation();
      const wizard = new ActionWizard("setup");
      wizard.select("color", {
        description: "Pick",
        actions: [{ id: "red", label: "Red" }],
      });

      const mw = wizard.middleware();
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      const sentActions = conversation.sendActions.mock.calls[0]![0];
      expect(sentActions.actions).toHaveLength(1);
    });
  });

  describe("restart", () => {
    it("cancels existing session and restarts when command is sent again", async () => {
      const conversation = createMockConversation();
      const cancelHandler = vi.fn();
      const wizard = new ActionWizard("setup");
      wizard
        .select("color", {
          description: "Pick",
          actions: [{ id: "red", label: "Red" }],
        })
        .onCancel(cancelHandler);

      const mw = wizard.middleware();

      // Start wizard
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      // Send command again while active
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      expect(cancelHandler).toHaveBeenCalledOnce();
      // Wizard re-sent the first step
      expect(conversation.sendActions).toHaveBeenCalledTimes(2);
      // Session is still active (restarted)
      expect(wizard.isActive(conversation.id, "sender-1")).toBe(true);
    });
  });

  describe("DM mode", () => {
    it("creates a DM conversation and sends steps there", async () => {
      const groupConversation = createMockConversation("group-1");
      const dmConversation = createMockConversation("dm-1");
      const createDm = vi.fn().mockResolvedValue(dmConversation);

      const wizard = new ActionWizard("secret", { dm: true });
      wizard.text("apiKey", { description: "Enter your API key" });

      const mw = wizard.middleware();
      await mw(
        createMockCtx({
          message: createTextMessage("/secret"),
          conversation: groupConversation,
          client: { conversations: { createDm } },
        }),
        vi.fn(),
      );

      expect(createDm).toHaveBeenCalledWith("sender-1");
      expect(dmConversation.sendText).toHaveBeenCalledWith(
        "Enter your API key",
      );
      expect(groupConversation.sendText).not.toHaveBeenCalled();
    });
  });

  describe("session isolation", () => {
    it("maintains separate sessions for different senders", async () => {
      const conversation = createMockConversation();
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("setup");
      wizard
        .text("name", { description: "Enter name" })
        .onComplete(completeHandler as never);

      const mw = wizard.middleware();

      // Sender 1 starts
      await mw(
        createMockCtx({
          message: createTextMessage("/setup", "sender-1"),
          conversation,
        }),
        vi.fn(),
      );
      // Sender 2 starts
      await mw(
        createMockCtx({
          message: createTextMessage("/setup", "sender-2"),
          conversation,
        }),
        vi.fn(),
      );

      expect(wizard.isActive(conversation.id, "sender-1")).toBe(true);
      expect(wizard.isActive(conversation.id, "sender-2")).toBe(true);

      // Sender 1 answers
      await mw(
        createMockCtx({
          message: createTextMessage("Alice", "sender-1"),
          conversation,
        }),
        vi.fn(),
      );

      expect(wizard.isActive(conversation.id, "sender-1")).toBe(false);
      expect(wizard.isActive(conversation.id, "sender-2")).toBe(true);
      expect(completeHandler).toHaveBeenCalledTimes(1);
      expect(completeHandler).toHaveBeenCalledWith(
        { name: "Alice" },
        expect.anything(),
      );
    });
  });

  describe("isActive", () => {
    it("returns false when no session exists", () => {
      const wizard = new ActionWizard("setup");
      expect(wizard.isActive("conv-1", "sender-1")).toBe(false);
    });
  });

  describe("pass-through behavior", () => {
    it("calls next() for text messages when waiting for a select step", async () => {
      const conversation = createMockConversation();
      const wizard = new ActionWizard("setup");
      wizard.select("color", {
        description: "Pick",
        actions: [{ id: "red", label: "Red" }],
      });

      const mw = wizard.middleware();

      // Start wizard (now waiting for select/intent)
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      // Send a text message (wrong type for select step)
      const next = vi.fn();
      await mw(
        createMockCtx({
          message: createTextMessage("hello"),
          conversation,
        }),
        next,
      );

      expect(next).toHaveBeenCalledOnce();
    });

    it("calls next() for intent messages when waiting for a text step", async () => {
      const conversation = createMockConversation();
      const wizard = new ActionWizard("setup");
      wizard.text("name", { description: "Enter name" });

      const mw = wizard.middleware();

      // Start wizard (now waiting for text)
      await mw(
        createMockCtx({
          message: createTextMessage("/setup"),
          conversation,
        }),
        vi.fn(),
      );

      // Send an intent (wrong type for text step)
      const next = vi.fn();
      await mw(
        createMockCtx({
          message: createIntentMessage("some-action"),
          conversation,
        }),
        next,
      );

      expect(next).toHaveBeenCalledOnce();
    });
  });
});
