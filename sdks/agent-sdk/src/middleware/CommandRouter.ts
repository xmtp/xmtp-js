import { type AgentEventHandler, type AgentMiddleware } from "@/core/Agent.js";
import type { AgentContext } from "@/core/AgentContext.js";
import { isText } from "@/utils/message.js";

export class CommandRouter<ContentTypes> {
  private commandMap = new Map<string, AgentEventHandler>();
  private defaultHandler: AgentEventHandler | null = null;

  command(command: string, handler: AgentEventHandler): this {
    if (!command.startsWith("/")) {
      throw new Error('Command must start with "/"');
    }
    this.commandMap.set(command.toLowerCase(), handler);
    return this;
  }

  default(handler: AgentEventHandler): this {
    this.defaultHandler = handler;
    return this;
  }

  async handle(ctx: AgentContext): Promise<boolean> {
    if (!isText(ctx.message)) {
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
