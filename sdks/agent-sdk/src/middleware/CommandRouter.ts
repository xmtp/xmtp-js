import { type AgentMessageHandler, type AgentMiddleware } from "@/core/Agent";
import type { MessageContext } from "@/core/MessageContext";

/** Content type supported by the "CommandRouter" */
type SupportedType = string;

interface CommandEntry {
  handler: AgentMessageHandler<SupportedType>;
  description?: string;
}

export interface CommandRouterConfig {
  /** Command string to trigger help output (e.g., "/help") */
  helpCommand?: `/${string}`;
}

export class CommandRouter<ContentTypes = unknown> {
  #commandMap = new Map<string, CommandEntry>();
  #defaultHandler: AgentMessageHandler<SupportedType> | null = null;

  constructor(config: CommandRouterConfig = {}) {
    if (config.helpCommand) {
      this.#registerHelpCommand(config.helpCommand);
    }
  }

  #registerHelpCommand(command: string): void {
    const helpHandler: AgentMessageHandler<SupportedType> = async (ctx) => {
      const lines: string[] = [];

      const sortedCommands = [...this.#commandMap.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      );

      sortedCommands.forEach(([cmd, entry], index) => {
        if (entry.description) {
          lines.push(`${index + 1}. \`${cmd}\` - ${entry.description}`);
        } else {
          lines.push(`${index + 1}. \`${cmd}\``);
        }
      });

      await ctx.sendMarkdownReply(lines.join("\n"));
    };

    this.command(command, "Show available commands", helpHandler);
  }

  get commandList(): string[] {
    return Array.from(this.#commandMap.keys());
  }

  command(
    command: string | string[],
    handler: AgentMessageHandler<SupportedType>,
  ): this;
  command(
    command: string | string[],
    description: string,
    handler: AgentMessageHandler<SupportedType>,
  ): this;
  command(
    command: string | string[],
    handlerOrDescription: AgentMessageHandler<SupportedType> | string,
    handler?: AgentMessageHandler<SupportedType>,
  ): this {
    const commands = Array.isArray(command) ? command : [command];

    for (const cmd of commands) {
      if (!cmd.startsWith("/")) {
        throw new Error('Command must start with "/"');
      }
    }

    let resolvedHandler: AgentMessageHandler<SupportedType>;
    let description: string | undefined;

    if (typeof handlerOrDescription === "function") {
      resolvedHandler = handlerOrDescription;
    } else {
      description = handlerOrDescription;
      if (!handler) {
        throw new Error(
          "Handler implementation is required when description is provided.",
        );
      }
      resolvedHandler = handler;
    }

    const entry: CommandEntry = {
      handler: resolvedHandler,
      description,
    };

    for (const cmd of commands) {
      this.#commandMap.set(cmd.toLowerCase(), entry);
    }

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
      const entry = this.#commandMap.get(command);
      if (entry) {
        // Create a new context with modified content (everything after the command)
        const argsText = parts.slice(1).join(" ");
        ctx.message.content = argsText;
        await entry.handler(ctx);
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
