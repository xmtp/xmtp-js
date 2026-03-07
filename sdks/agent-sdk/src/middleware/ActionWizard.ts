import { randomUUID } from "node:crypto";
import {
  isIntent,
  isText,
  type Action,
  type Actions,
  type Conversation,
} from "@xmtp/node-sdk";
import type { AgentMiddleware } from "@/core/Agent";
import type { MessageContext } from "@/core/MessageContext";

/** The cancel action ID is generated to guarantee no collision with user-defined action IDs */
const CANCEL_ACTION_ID = randomUUID();

/** User responds by clicking a button (triggers an intent) */
type SelectStep = {
  readonly type: "select";
  readonly id: string;
  readonly description: string;
  readonly actions: Action[];
};

/** User responds by typing a message (sends a text message) */
type TextStep = {
  readonly type: "text";
  readonly id: string;
  readonly description: string;
};

type ActionWizardStep = SelectStep | TextStep;

type ActionWizardSession = {
  currentStepIndex: number;
  readonly answers: Record<string, string>;
  readonly conversation: Conversation;
};

type ActionWizardCompleteHandler<ContentTypes> = (
  answers: Record<string, string>,
  ctx: MessageContext<unknown, ContentTypes>,
) => Promise<void> | void;

type ActionWizardCancelHandler<ContentTypes> = (
  ctx: MessageContext<unknown, ContentTypes>,
) => Promise<void> | void;

export type ActionWizardCancelOptions = {
  /** Custom label for the cancel button (default: "Cancel") */
  readonly label?: string;
};

export type ActionWizardOptions = {
  /**
   * When true, the wizard sends all steps via DM to the user.
   * Recommended when the user is expected to enter sensitive information
   * (e.g. API keys, passwords) to keep it out of group conversations.
   */
  readonly dm?: boolean;
  /** Enable a cancel button on each select step. Set to `true` for the default label, or pass options to customize. */
  readonly cancel?: boolean | ActionWizardCancelOptions;
};

export class ActionWizard<ContentTypes = unknown> {
  #id: string;
  #dm: boolean;
  #cancelLabel: string | undefined;
  #steps: ActionWizardStep[] = [];
  #sessions = new Map<string, ActionWizardSession>();
  #completeHandler?: ActionWizardCompleteHandler<ContentTypes>;
  #cancelHandler?: ActionWizardCancelHandler<ContentTypes>;

  constructor(id: string, options?: ActionWizardOptions) {
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

  onComplete(handler: ActionWizardCompleteHandler<ContentTypes>): this {
    this.#completeHandler = handler;
    return this;
  }

  onCancel(handler: ActionWizardCancelHandler<ContentTypes>): this {
    this.#cancelHandler = handler;
    return this;
  }

  async start(ctx: MessageContext<unknown, ContentTypes>): Promise<void> {
    const { senderInboxId } = ctx.message;
    const conversation = this.#dm
      ? await ctx.client.conversations.createDm(senderInboxId)
      : ctx.conversation;

    const key = ActionWizard.sessionKey(conversation.id, senderInboxId);
    this.#sessions.set(key, {
      currentStepIndex: 0,
      answers: {},
      conversation,
    });
    await this.#sendCurrentStep(key);
  }

  isActive(conversationId: string, senderInboxId: string): boolean {
    return this.#sessions.has(ActionWizard.sessionKey(conversationId, senderInboxId));
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
        id: ActionWizard.stepKey(this.#id, step.id),
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

    const isComplete = session.currentStepIndex >= this.#steps.length;
    if (isComplete) {
      const answers = { ...session.answers };
      this.#sessions.delete(key);
      await this.#completeHandler?.(answers, ctx);
    } else {
      await this.#sendCurrentStep(key);
    }
  }

  middleware(): AgentMiddleware<ContentTypes> {
    return async (ctx, next) => {
      const key = ActionWizard.sessionKey(
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

      if (isIntent(ctx.message) && ctx.message.content) {
        const { actionId } = ctx.message.content;
        if (this.#cancelLabel && actionId === CANCEL_ACTION_ID) {
          await this.#handleCancel(key, ctx);
          return;
        }
        if (step.type === "select") {
          session.answers[step.id] = actionId;
          await this.#advance(key, ctx);
          return;
        }
      }

      if (step.type === "text" && isText(ctx.message) && ctx.message.content) {
        session.answers[step.id] = ctx.message.content;
        await this.#advance(key, ctx);
        return;
      }

      await next();
    };
  }
}
