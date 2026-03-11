import {
  isActions,
  isMarkdown,
  isText,
  type BuiltInContentTypes,
  type Client,
} from "@xmtp/node-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Agent } from "@/core/Agent";
import { ActionWizard } from "@/middleware/ActionWizard";
import { createClient } from "@/util/test";

describe("ActionWizard", () => {
  describe("static helpers", () => {
    it("builds a session key", () => {
      expect(ActionWizard.sessionKey("conv-1", "sender-1")).toBe(
        "conv-1:sender-1",
      );
    });

    it("builds a step key", () => {
      expect(ActionWizard.stepKey("setup", "color")).toBe("setup:color");
    });
  });

  describe("Builder API", () => {
    it("returns this from all methods for chaining", () => {
      const wizard = new ActionWizard("w");
      expect(
        wizard.select("s", {
          description: "Pick",
          actions: [{ id: "a", label: "A" }],
        }),
      ).toBe(wizard);
      expect(wizard.text("name-label", { description: "Enter name" })).toBe(
        wizard,
      );
      expect(wizard.onComplete(vi.fn())).toBe(wizard);
      expect(wizard.onCancel(vi.fn())).toBe(wizard);
    });
  });

  describe("select step", () => {
    let agent: Agent<BuiltInContentTypes>;
    let client: Client;

    beforeEach(async () => {
      client = await createClient();
      agent = new Agent({ client });
    });

    it("sends actions when the trigger command is received", async () => {
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("setup");
      wizard
        .select("color", {
          description: "Pick a color",
          actions: [
            { id: "red", label: "Red" },
            { id: "blue", label: "Blue" },
          ],
        })
        .onComplete(completeHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/setup");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        const actionsMessage = messages.find((m) => isActions(m));
        expect(actionsMessage?.content).toMatchObject({
          id: "setup:color",
          description: "Pick a color",
        });
      });
    });

    it("records the answer and completes when an intent is received", async () => {
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("setup");
      wizard
        .select("color", {
          description: "Pick a color",
          actions: [
            { id: "red", label: "Red" },
            { id: "blue", label: "Blue" },
          ],
        })
        .onComplete(completeHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/setup");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        expect(messages.some((m) => isActions(m))).toBe(true);
      });

      await dm.sendIntent({ id: "setup:color", actionId: "blue" });

      await vi.waitFor(() => {
        expect(completeHandler).toHaveBeenCalledWith(
          { color: "blue" },
          expect.anything(),
        );
      });
    });
  });

  describe("text step", () => {
    let agent: Agent<BuiltInContentTypes>;
    let client: Client;

    beforeEach(async () => {
      client = await createClient();
      agent = new Agent({ client });
    });

    it("sends the description as text when the trigger command is received", async () => {
      const wizard = new ActionWizard("config");
      wizard.text("name", { description: "Enter your name" });

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/config");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        const textMessages = messages.filter((m) => isText(m));
        const descriptions = textMessages.map((m) => m.content);
        expect(descriptions).toContain("Enter your name");
      });
    });

    it("can send the description as markdown", async () => {
      const wizard = new ActionWizard("config");
      wizard.text("name", {
        description: "**Enter your name**",
        isMarkdown: true,
      });

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/config");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        const mdMessage = messages.find((m) => isMarkdown(m));
        expect(mdMessage?.content).toBe("**Enter your name**");
      });
    });

    it("records the answer and completes when a text reply is received", async () => {
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("config");
      wizard
        .text("name", { description: "Enter your name" })
        .onComplete(completeHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/config");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        const textMessages = messages.filter((m) => isText(m));
        expect(textMessages.map((m) => m.content)).toContain("Enter your name");
      });

      await dm.sendText("Alice");

      await vi.waitFor(() => {
        expect(completeHandler).toHaveBeenCalledWith(
          { name: "Alice" },
          expect.anything(),
        );
      });
    });
  });

  describe("multi-step wizard", () => {
    let agent: Agent<BuiltInContentTypes>;
    let client: Client;

    beforeEach(async () => {
      client = await createClient();
      agent = new Agent({ client });
    });

    it("advances through all steps and calls complete with all answers", async () => {
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("onboard");
      wizard
        .select("plan", {
          description: "Choose plan",
          actions: [
            { id: "free", label: "Free" },
            { id: "pro", label: "Pro" },
          ],
        })
        .text("email", { description: "Enter your email" })
        .onComplete(completeHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/onboard");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        expect(messages.some((m) => isActions(m))).toBe(true);
      });

      // Step 1: select plan
      await dm.sendIntent({ id: "onboard:plan", actionId: "pro" });

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        const textMessages = messages.filter((m) => isText(m));
        expect(textMessages.map((m) => m.content)).toContain(
          "Enter your email",
        );
      });

      // Step 2: enter email
      await dm.sendText("user@example.com");

      await vi.waitFor(() => {
        expect(completeHandler).toHaveBeenCalledWith(
          { plan: "pro", email: "user@example.com" },
          expect.anything(),
        );
      });
    });
  });

  describe("cancel", () => {
    let agent: Agent<BuiltInContentTypes>;
    let client: Client;

    beforeEach(async () => {
      client = await createClient();
      agent = new Agent({ client });
    });

    it("adds a cancel button to select steps and handles cancel intent", async () => {
      const cancelHandler = vi.fn();
      const wizard = new ActionWizard("setup", { cancel: true });
      wizard
        .select("color", {
          description: "Pick",
          actions: [{ id: "red", label: "Red" }],
        })
        .onCancel(cancelHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/setup");

      // Wait for actions to be sent, then extract the cancel action ID
      let cancelActionId = "";
      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        const actionsMessage = messages.find((m) => isActions(m));
        const actions = actionsMessage?.content?.actions ?? [];
        expect(actions).toHaveLength(2);
        expect(actions[1]?.label).toBe("Cancel");
        cancelActionId = actions[1]?.id ?? "";
      });

      // Click cancel
      await dm.sendIntent({ id: "setup:color", actionId: cancelActionId });

      await vi.waitFor(() => {
        expect(cancelHandler).toHaveBeenCalledTimes(1);
      });
    });

    it("uses a custom cancel label", async () => {
      const wizard = new ActionWizard("setup", {
        cancel: { label: "Abort" },
      });
      wizard.select("color", {
        description: "Pick",
        actions: [{ id: "red", label: "Red" }],
      });

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/setup");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        const actionsMessage = messages.find((m) => isActions(m));
        expect(actionsMessage?.content?.actions[1]?.label).toBe("Abort");
      });
    });
  });

  describe("restart", () => {
    let agent: Agent<BuiltInContentTypes>;
    let client: Client;

    beforeEach(async () => {
      client = await createClient();
      agent = new Agent({ client });
    });

    it("cancels existing session and restarts when command is sent again", async () => {
      const cancelHandler = vi.fn();
      const wizard = new ActionWizard("setup");
      wizard
        .select("color", {
          description: "Pick",
          actions: [{ id: "red", label: "Red" }],
        })
        .onCancel(cancelHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("/setup");

      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        expect(messages.filter((m) => isActions(m))).toHaveLength(1);
      });

      // Send command again while active
      await dm.sendText("/setup");

      await vi.waitFor(() => {
        expect(cancelHandler).toHaveBeenCalledOnce();
      });

      // Wizard re-sent the first step
      await vi.waitFor(async () => {
        await dm.sync();
        const messages = await dm.messages();
        expect(messages.filter((m) => isActions(m))).toHaveLength(2);
      });
    });
  });

  describe("DM mode", () => {
    let agent: Agent<BuiltInContentTypes>;
    let client: Client;

    beforeEach(async () => {
      client = await createClient();
      agent = new Agent({ client });
    });

    it("creates a DM conversation and sends steps there", async () => {
      const wizard = new ActionWizard("secret", { dm: true });
      wizard.text("apiKey", { description: "Enter your API key" });

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const group = await otherClient.conversations.createGroup([
        client.inboxId,
      ]);
      await group.sendText("/secret");

      // The wizard should send the step via DM, not in the group
      await vi.waitFor(async () => {
        await client.conversations.sync();
        const dms = client.conversations.listDms();
        expect(dms.length).toBeGreaterThan(0);
        const dm = dms[0];
        await dm?.sync();
        const messages = (await dm?.messages()) ?? [];
        const textMessages = messages.filter((m) => isText(m));
        expect(textMessages.map((m) => m.content)).toContain(
          "Enter your API key",
        );
      });
    });

    it("completes a text step wizard via DM when triggered from a group", async () => {
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("secret", { dm: true });
      wizard
        .text("apiKey", { description: "Enter your API key" })
        .onComplete(completeHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const group = await otherClient.conversations.createGroup([
        client.inboxId,
      ]);
      await group.sendText("/secret");

      // Wait for the DM step to arrive, then reply in the DM
      await vi.waitFor(async () => {
        await otherClient.conversations.sync();
        const dms = otherClient.conversations.listDms();
        expect(dms.length).toBeGreaterThan(0);
        const dm = dms[0];
        await dm?.sync();
        const messages = (await dm?.messages()) ?? [];
        const textMessages = messages.filter((m) => isText(m));
        expect(textMessages.map((m) => m.content)).toContain(
          "Enter your API key",
        );
      });

      const dm = otherClient.conversations.listDms()[0]!;
      await dm.sendText("sk-12345");

      await vi.waitFor(() => {
        expect(completeHandler).toHaveBeenCalledWith(
          { apiKey: "sk-12345" },
          expect.anything(),
        );
      });
    });

    it("completes a multi-step wizard entirely via DM", async () => {
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("onboard", { dm: true });
      wizard
        .select("plan", {
          description: "Choose plan",
          actions: [
            { id: "free", label: "Free" },
            { id: "pro", label: "Pro" },
          ],
        })
        .text("email", { description: "Enter your email" })
        .onComplete(completeHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const otherClient = await createClient();
      const group = await otherClient.conversations.createGroup([
        client.inboxId,
      ]);
      await group.sendText("/onboard");

      // Wait for the select step to arrive in the DM
      await vi.waitFor(async () => {
        await otherClient.conversations.sync();
        const dms = otherClient.conversations.listDms();
        expect(dms.length).toBeGreaterThan(0);
        const dm = dms[0];
        await dm?.sync();
        const messages = (await dm?.messages()) ?? [];
        expect(messages.some((m) => isActions(m))).toBe(true);
      });

      // Step 1: select plan in the DM
      const dm = otherClient.conversations.listDms()[0];
      await dm?.sendIntent({ id: "onboard:plan", actionId: "pro" });

      // Wait for step 2 to arrive in the DM
      await vi.waitFor(async () => {
        await dm?.sync();
        const messages = await dm?.messages();
        const textMessages = messages?.filter((m) => isText(m));
        expect(textMessages?.map((m) => m.content)).toContain(
          "Enter your email",
        );
      });

      // Step 2: enter email in the DM
      await dm?.sendText("user@example.com");

      await vi.waitFor(() => {
        expect(completeHandler).toHaveBeenCalledWith(
          { plan: "pro", email: "user@example.com" },
          expect.anything(),
        );
      });
    });
  });

  describe("session isolation", () => {
    let agent: Agent<BuiltInContentTypes>;
    let client: Client;

    beforeEach(async () => {
      client = await createClient();
      agent = new Agent({ client });
    });

    it("maintains separate sessions for different senders", async () => {
      const completeHandler = vi.fn();
      const wizard = new ActionWizard("setup");
      wizard
        .text("name", { description: "Enter name" })
        .onComplete(completeHandler);

      agent.use(wizard.middleware());
      await agent.start();

      const sender1 = await createClient();
      const sender2 = await createClient();
      const dm1 = await sender1.conversations.createDm(client.inboxId);
      const dm2 = await sender2.conversations.createDm(client.inboxId);

      // Both senders start the wizard
      await dm1.sendText("/setup");
      await dm2.sendText("/setup");

      await vi.waitFor(async () => {
        await dm1.sync();
        await dm2.sync();
        const msgs1 = await dm1.messages();
        const msgs2 = await dm2.messages();
        expect(msgs1.filter((m) => isText(m)).map((m) => m.content)).toContain(
          "Enter name",
        );
        expect(msgs2.filter((m) => isText(m)).map((m) => m.content)).toContain(
          "Enter name",
        );
      });

      // Only sender 1 answers
      await dm1.sendText("Alice");

      await vi.waitFor(() => {
        expect(completeHandler).toHaveBeenCalledTimes(1);
        expect(completeHandler).toHaveBeenCalledWith(
          { name: "Alice" },
          expect.anything(),
        );
      });
    });
  });
});
