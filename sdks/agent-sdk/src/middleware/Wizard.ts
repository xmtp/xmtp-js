import {
  isIntent,
  isText,
  type Action,
  type Actions,
  type Conversation,
} from "@xmtp/node-sdk";
import type { AgentMiddleware } from "@/core/Agent";
import type { MessageContext } from "@/core/MessageContext";

const CANCEL_ACTION_ID = "d3b07384-d113-4ec6-a1e2-bc1a4f2e8c69";

/** User responds by clicking a button (triggers an intent) */
interface SelectStep {
  type: "select";
  id: string;
  description: string;
  actions: Action[];
}

/** User responds by typing a message (sends a text message) */
interface TextStep {
  type: "text";
  id: string;
  description: string;
}

type WizardStep = SelectStep | TextStep;

interface WizardSession {
  currentStepIndex: number;
  answers: Record<string, string>;
  conversation: Conversation;
}

type WizardCompleteHandler<ContentTypes> = (
  answers: Record<string, string>,
  ctx: MessageContext<unknown, ContentTypes>,
) => Promise<void> | void;

type WizardCancelHandler<ContentTypes> = (
  ctx: MessageContext<unknown, ContentTypes>,
) => Promise<void> | void;

export interface WizardCancelOptions {
  /** Custom label for the cancel button (default: "Cancel") */
  label?: string;
}

export interface WizardOptions {
  /**
   * When true, the wizard sends all steps via DM to the user.
   * Recommended when the user is expected to enter sensitive information
   * (e.g. API keys, passwords) to keep it out of group conversations.
   */
  dm?: boolean;
  /** Enable a cancel button on each select step. Set to `true` for the default label, or pass options to customize. */
  cancel?: boolean | WizardCancelOptions;
}

export class Wizard<ContentTypes = unknown> {
  #id: string;
  #dm: boolean;
  #cancelLabel: string | undefined;
  #steps: WizardStep[] = [];
  #sessions = new Map<string, WizardSession>();
  #completeHandler?: WizardCompleteHandler<ContentTypes>;
  #cancelHandler?: WizardCancelHandler<ContentTypes>;

  constructor(id: string, options?: WizardOptions) {
    this.#id = id;
    this.#dm = options?.dm ?? false;
    if (options?.cancel) {
      this.#cancelLabel =
        typeof options.cancel === "object"
          ? (options.cancel.label ?? "Cancel")
          : "Cancel";
    }
  }

  static sessionKey(conversationId: string, senderInboxId: string): string {
    return `${conversationId}:${senderInboxId}`;
  }

  static stepKey(wizardId: string, stepId: string): string {
    return `${wizardId}:${stepId}`;
  }

  select(
    id: string,
    options: { description: string; actions: Action[] },
  ): this {
    this.#steps.push({
      type: "select",
      id,
      description: options.description,
      actions: options.actions,
    });
    return this;
  }

  text(id: string, options: { description: string }): this {
    this.#steps.push({
      type: "text",
      id,
      description: options.description,
    });
    return this;
  }

  onComplete(handler: WizardCompleteHandler<ContentTypes>): this {
    this.#completeHandler = handler;
    return this;
  }

  onCancel(handler: WizardCancelHandler<ContentTypes>): this {
    this.#cancelHandler = handler;
    return this;
  }

  async start(ctx: MessageContext<unknown, ContentTypes>): Promise<void> {
    const senderInboxId = ctx.message.senderInboxId;

    let conversation: Conversation;
    if (this.#dm) {
      conversation = await ctx.client.conversations.createDm(senderInboxId);
    } else {
      conversation = ctx.conversation;
    }

    const key = Wizard.sessionKey(conversation.id, senderInboxId);
    this.#sessions.set(key, {
      currentStepIndex: 0,
      answers: {},
      conversation,
    });
    await this.#sendCurrentStep(key);
  }

  isActive(conversationId: string, senderInboxId: string): boolean {
    return this.#sessions.has(Wizard.sessionKey(conversationId, senderInboxId));
  }

  async #sendCurrentStep(key: string): Promise<void> {
    const session = this.#sessions.get(key);
    if (!session) return;

    const step = this.#steps[session.currentStepIndex];
    if (!step) return;

    if (step.type === "select") {
      const stepActions = this.#cancelLabel
        ? [...step.actions, { id: CANCEL_ACTION_ID, label: this.#cancelLabel }]
        : step.actions;
      const actions: Actions = {
        id: Wizard.stepKey(this.#id, step.id),
        description: step.description,
        actions: stepActions,
      };
      await session.conversation.sendActions(actions);
    } else {
      await session.conversation.sendText(step.description);
    }
  }

  async #handleCancel(
    key: string,
    ctx: MessageContext<unknown, ContentTypes>,
  ): Promise<void> {
    this.#sessions.delete(key);
    await this.#cancelHandler?.(ctx);
  }

  async #advance(
    key: string,
    ctx: MessageContext<unknown, ContentTypes>,
  ): Promise<void> {
    const session = this.#sessions.get(key);
    if (!session) return;

    session.currentStepIndex++;

    if (session.currentStepIndex >= this.#steps.length) {
      const answers = { ...session.answers };
      this.#sessions.delete(key);
      await this.#completeHandler?.(answers, ctx);
    } else {
      await this.#sendCurrentStep(key);
    }
  }

  middleware(): AgentMiddleware<ContentTypes> {
    return async (ctx, next) => {
      const key = Wizard.sessionKey(
        ctx.conversation.id,
        ctx.message.senderInboxId,
      );
      const session = this.#sessions.get(key);

      if (!session) {
        await next();
        return;
      }

      const step = this.#steps[session.currentStepIndex];
      if (!step) {
        await next();
        return;
      }

      if (isIntent(ctx.message)) {
        const { actionId } = ctx.message.content!;
        if (this.#cancelLabel && actionId === CANCEL_ACTION_ID) {
          await this.#handleCancel(
            key,
            ctx as MessageContext<unknown, ContentTypes>,
          );
          return;
        }
        if (step.type === "select") {
          session.answers[step.id] = actionId;
          await this.#advance(
            key,
            ctx as MessageContext<unknown, ContentTypes>,
          );
          return;
        }
      }

      if (step.type === "text" && isText(ctx.message)) {
        session.answers[step.id] = ctx.message.content!;
        await this.#advance(key, ctx as MessageContext<unknown, ContentTypes>);
        return;
      }

      await next();
    };
  }
}
