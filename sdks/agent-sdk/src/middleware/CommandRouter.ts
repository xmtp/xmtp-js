import {
  type AgentMessageHandler,
  type AgentMiddleware,
} from "@/core/Agent.js";
import type { MessageContext } from "@/core/MessageContext.js";
import { filter } from "@/utils/filter.js";

export class CommandRouter<ContentTypes> {
  private commandMap = new Map<string, AgentMessageHandler>();
  private defaultHandler: AgentMessageHandler | null = null;

  command(command: string, handler: AgentMessageHandler): this {
    if (!command.startsWith("/")) {
      throw new Error('Command must start with "/"');
    }
    this.commandMap.set(command.toLowerCase(), handler);
    return this;
  }

  default(handler: AgentMessageHandler): this {
    this.defaultHandler = handler;
    return this;
  }

  async handle(ctx: MessageContext): Promise<boolean> {
    if (!filter.isText(ctx.message)) {
      return false;
    }

    const messageText = ctx.message.content;
    const parts = messageText.split(" ");
    const command = parts[0].toLowerCase();

    // Check if this is a command message
    if (command.startsWith("/")) {
      const handler = this.commandMap.get(command);
      if (handler) {
        await handler(ctx);
        return true;
      }
    }

    // If no command matched and there's a default handler, use it
    if (this.defaultHandler) {
      await this.defaultHandler(ctx);
      return true;
    }

    return false;
  }

  middleware: () => AgentMiddleware<ContentTypes> = () => async (ctx, next) => {
    const handled = await this.handle(ctx);
    if (!handled) {
      await next();
    }
  };
}
