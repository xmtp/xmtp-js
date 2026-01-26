import type { BuiltInContentTypes } from "@xmtp/node-sdk";
import { type AgentMessageHandler, type AgentMiddleware } from "@/core/Agent";
import type { MessageContext } from "@/core/MessageContext";

/** Content type supported by the "CommandRouter" */
type SupportedType = string;

export class CommandRouter<ContentTypes = BuiltInContentTypes> {
  #commandMap = new Map<string, AgentMessageHandler<SupportedType>>();
  #defaultHandler: AgentMessageHandler<SupportedType> | null = null;

  get commandList(): string[] {
    return Array.from(this.#commandMap.keys());
  }

  command(command: string, handler: AgentMessageHandler<SupportedType>): this {
    if (!command.startsWith("/")) {
      throw new Error('Command must start with "/"');
    }
    this.#commandMap.set(command.toLowerCase(), handler);
    return this;
  }

  default(handler: AgentMessageHandler<SupportedType>): this {
    this.#defaultHandler = handler;
    return this;
  }

  async handle(ctx: MessageContext<SupportedType>): Promise<boolean> {
    const messageText = ctx.message.content;
    const parts = messageText.split(" ");
    const command = parts[0]?.toLowerCase();

    if (!command) {
      return false;
    }

    // Check if this is a command message
    if (command.startsWith("/")) {
      const handler = this.#commandMap.get(command);
      if (handler) {
        // Create a new context with modified content (everything after the command)
        const argsText = parts.slice(1).join(" ");
        ctx.message.content = argsText;
        await handler(ctx);
        return true;
      }
    }

    // If no command matched and there's a default handler, use it
    if (this.#defaultHandler) {
      await this.#defaultHandler(ctx);
      return true;
    }

    return false;
  }

  middleware(): AgentMiddleware<ContentTypes> {
    return async (ctx, next) => {
      if (ctx.isText()) {
        const handled = await this.handle(ctx);
        if (!handled) {
          await next();
        }
      } else {
        await next();
      }
    };
  }
}
