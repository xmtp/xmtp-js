import { isIntent, isText, type Action, type Actions } from "@xmtp/node-sdk";
import type { AgentMiddleware } from "@/core/Agent";
import type { MessageContext } from "@/core/MessageContext";

const CANCEL_ACTION_ID = "__wizard_cancel__";

interface SelectStep {
  type: "select";
  id: string;
  description: string;
  actions: Action[];
}

interface TextStep {
  type: "text";
  id: string;
  description: string;
}

type WizardStep = SelectStep | TextStep;

interface WizardSession {
  currentStepIndex: number;
  answers: Record<string, string>;
}

type WizardCompleteHandler<ContentTypes> = (
  answers: Record<string, string>,
  ctx: MessageContext<unknown, ContentTypes>,
) => Promise<void> | void;

type WizardCancelHandler<ContentTypes> = (
  ctx: MessageContext<unknown, ContentTypes>,
) => Promise<void> | void;

export class Wizard<ContentTypes = unknown> {
  #id: string;
  #steps: WizardStep[] = [];
  #sessions = new Map<string, WizardSession>();
  #completeHandler?: WizardCompleteHandler<ContentTypes>;
  #cancelHandler?: WizardCancelHandler<ContentTypes>;

  constructor(id: string) {
    this.#id = id;
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
    const conversationId = ctx.conversation.id;
    this.#sessions.set(conversationId, {
      currentStepIndex: 0,
      answers: {},
    });
    await this.#sendCurrentStep(ctx);
  }

  isActive(conversationId: string): boolean {
    return this.#sessions.has(conversationId);
  }

  async #sendCurrentStep(
    ctx: MessageContext<unknown, ContentTypes>,
  ): Promise<void> {
    const session = this.#sessions.get(ctx.conversation.id);
    if (!session) return;

    const step = this.#steps[session.currentStepIndex];
    if (!step) return;

    if (step.type === "select") {
      const actions: Actions = {
        id: `${this.#id}_${step.id}`,
        description: step.description,
        actions: [...step.actions, { id: CANCEL_ACTION_ID, label: "Cancel" }],
      };
      await ctx.conversation.sendActions(actions);
    } else {
      await ctx.conversation.sendText(step.description);
    }
  }

  async #handleCancel(
    ctx: MessageContext<unknown, ContentTypes>,
  ): Promise<void> {
    this.#sessions.delete(ctx.conversation.id);
    await this.#cancelHandler?.(ctx);
  }

  async #advance(ctx: MessageContext<unknown, ContentTypes>): Promise<void> {
    const session = this.#sessions.get(ctx.conversation.id);
    if (!session) return;

    session.currentStepIndex++;

    if (session.currentStepIndex >= this.#steps.length) {
      const answers = { ...session.answers };
      this.#sessions.delete(ctx.conversation.id);
      await this.#completeHandler?.(answers, ctx);
    } else {
      await this.#sendCurrentStep(ctx);
    }
  }

  middleware(): AgentMiddleware<ContentTypes> {
    return async (ctx, next) => {
      const conversationId = ctx.conversation.id;
      const session = this.#sessions.get(conversationId);

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
        if (actionId === CANCEL_ACTION_ID) {
          await this.#handleCancel(
            ctx as MessageContext<unknown, ContentTypes>,
          );
          return;
        }
        if (step.type === "select") {
          session.answers[step.id] = actionId;
          await this.#advance(ctx as MessageContext<unknown, ContentTypes>);
          return;
        }
      }

      if (step.type === "text" && isText(ctx.message)) {
        session.answers[step.id] = ctx.message.content!;
        await this.#advance(ctx as MessageContext<unknown, ContentTypes>);
        return;
      }

      await next();
    };
  }
}
