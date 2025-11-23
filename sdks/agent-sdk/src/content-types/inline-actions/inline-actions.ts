import type { AgentMiddleware } from "@/core/Agent.js";
import type { Conversation } from "@xmtp/node-sdk";
import type { MessageContext } from "@/core/MessageContext.js";
import {
  ContentTypeActions,
  type Action,
  type ActionsContent,
} from "./types/ActionsContent.js";
import { type IntentContent } from "./types/IntentContent.js";

// Core types
export type ActionHandler = (ctx: MessageContext) => Promise<void>;

// Action registry
const actionHandlers = new Map<string, ActionHandler>();

// Track the last sent action message for reply functionality
let lastSentActionMessage: unknown = null;

// Track the last shown menu for automatic navigation
let lastShownMenu: { config: AppConfig; menuId: string } | null = null;

export function registerAction(actionId: string, handler: ActionHandler): void {
  // Prevent overwriting existing handlers unless explicitly intended
  if (actionHandlers.has(actionId)) {
    console.warn(`⚠️ Action ${actionId} already registered, overwriting...`);
  }
  actionHandlers.set(actionId, handler);
}

// Get the last sent action message for reply functionality
export function getLastSentActionMessage(): unknown {
  return lastSentActionMessage;
}

// Clear all registered actions (useful for debugging)
export function clearAllActions(): void {
  actionHandlers.clear();
  console.log("🧹 Cleared all registered actions");
}

// Show the last shown menu
export async function showLastMenu(ctx: MessageContext): Promise<void> {
  if (lastShownMenu) {
    console.log(`🔄 Showing last menu: ${lastShownMenu.menuId}`);
    await showMenu(ctx, lastShownMenu.config, lastShownMenu.menuId);
  } else {
    console.warn("⚠️ No last menu to show, falling back to main menu");
    // Fallback to main menu if no last menu is tracked
    await ctx.sendText("Returning to main menu...");
  }
}

// Middleware
export const inlineActionsMiddleware: AgentMiddleware = async (ctx, next) => {
  if (ctx.message.contentType?.typeId === "intent") {
    const intentContent = ctx.message.content as IntentContent;
    const handler = actionHandlers.get(intentContent.actionId);

    console.log("🎯 Processing intent:", intentContent.actionId);

    if (handler) {
      try {
        await handler(ctx);
      } catch (error) {
        console.error(`❌ Error in action handler:`, error);
        await ctx.sendText(
          `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      await ctx.sendText(`❌ Unknown action: ${intentContent.actionId}`);
    }
    return;
  }
  await next();
};

// Builder for creating actions
export class ActionBuilder {
  private actions: Action[] = [];
  private actionId = "";
  private actionDescription = "";

  static create(id: string, description: string): ActionBuilder {
    const builder = new ActionBuilder();
    builder.actionId = id;
    builder.actionDescription = description;
    return builder;
  }

  add(
    id: string,
    label: string,
    style?: "primary" | "secondary" | "danger",
  ): this {
    this.actions.push({ id, label, style });
    return this;
  }

  build(): ActionsContent {
    return {
      id: this.actionId,
      description: this.actionDescription,
      actions: this.actions,
    };
  }

  async send(ctx: MessageContext): Promise<void> {
    const message = await ctx.conversation.send(
      this.build(),
      ContentTypeActions,
    );
    lastSentActionMessage = message;
  }
}

// Helper functions
export async function sendActions(
  conversation: Conversation,
  actionsContent: ActionsContent,
): Promise<void> {
  const message = await conversation.send(actionsContent, ContentTypeActions);
  lastSentActionMessage = message;
}

export async function sendConfirmation(
  ctx: MessageContext,
  message: string,
  onYes: ActionHandler,
  onNo?: ActionHandler,
): Promise<void> {
  const timestamp = Date.now();
  const yesId = `yes-${timestamp}`;
  const noId = `no-${timestamp}`;

  registerAction(yesId, onYes);
  registerAction(
    noId,
    onNo ||
      (async (ctx) => {
        await ctx.sendText("❌ Cancelled");
      }),
  );

  await ActionBuilder.create(`confirm-${timestamp}`, message)
    .add(yesId, "✅ Yes")
    .add(noId, "❌ No", "danger")
    .send(ctx);
}

export async function sendSelection(
  ctx: MessageContext,
  message: string,
  options: Array<{
    id: string;
    label: string;
    style?: "primary" | "secondary" | "danger";
    handler: ActionHandler;
  }>,
): Promise<void> {
  const builder = ActionBuilder.create(`selection-${Date.now()}`, message);

  options.forEach((option) => {
    registerAction(option.id, option.handler);
    builder.add(option.id, option.label, option.style);
  });

  await builder.send(ctx);
}

// Validation helpers
export const validators = {
  inboxId: (input: string) => {
    const pattern = /^[a-fA-F0-9]{64}$/;
    return pattern.test(input.trim())
      ? { valid: true }
      : { valid: false, error: "Invalid Inbox ID format (64 hex chars)" };
  },

  ethereumAddress: (input: string) => {
    const pattern = /^0x[a-fA-F0-9]{40}$/;
    return pattern.test(input.trim())
      ? { valid: true }
      : {
          valid: false,
          error: "Invalid Ethereum address format (0x + 40 hex chars)",
        };
  },
};

// Common patterns
export const patterns = {
  inboxId: /^[a-fA-F0-9]{64}$/,
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
};

// Additional types needed by index.ts
export type MenuAction = {
  id: string;
  label: string;
  style?: "primary" | "secondary" | "danger";
  handler?: ActionHandler;
  showNavigationOptions?: boolean;
};

export type Menu = {
  id: string;
  title: string;
  actions: MenuAction[];
};

export type AppConfig = {
  name: string;
  menus: Record<string, Menu>;
  options?: {
    autoShowMenuAfterAction?: boolean;
    defaultNavigationMessage?: string;
  };
};

// Utility functions needed by index.ts
export function getRegisteredActions(): string[] {
  return Array.from(actionHandlers.keys());
}

export async function showMenu(
  ctx: MessageContext,
  config: AppConfig,
  menuId: string,
): Promise<void> {
  const menu = config.menus[menuId];
  if (!menu) {
    console.error(`❌ Menu not found: ${menuId}`);
    await ctx.sendText(`❌ Menu not found: ${menuId}`);
    return;
  }

  // Track the last shown menu
  lastShownMenu = { config, menuId };

  // Use a stable action ID without timestamp to prevent conflicts
  const builder = ActionBuilder.create(menuId, menu.title);

  menu.actions.forEach((action) => {
    builder.add(action.id, action.label, action.style);
  });

  await builder.send(ctx);
}

// Configurable navigation helper
export async function showNavigationOptions(
  ctx: MessageContext,
  config: AppConfig,
  message: string,
  customActions?: Array<{
    id: string;
    label: string;
    style?: "primary" | "secondary" | "danger";
  }>,
): Promise<void> {
  // Check if auto-show menu is enabled (default: true for backward compatibility)
  const autoShowMenu = config.options?.autoShowMenuAfterAction !== false;

  if (!autoShowMenu) {
    // If auto-show is disabled, just send the message without showing menu
    await ctx.sendText(message);
    return;
  }

  // Use a stable action ID to prevent conflicts
  const navigationMenu = ActionBuilder.create("navigation-options", message);

  // Add custom actions if provided
  if (customActions) {
    customActions.forEach((action) => {
      navigationMenu.add(action.id, action.label, action.style);
    });
  } else {
    // Default navigation options - show all main menu items
    const mainMenu = config.menus["main-menu"];
    if (mainMenu) {
      mainMenu.actions.forEach((action) => {
        navigationMenu.add(action.id, action.label, action.style);
      });
    }
  }

  await navigationMenu.send(ctx);
}

export function initializeAppFromConfig(
  config: AppConfig,
  options?: {
    deferredHandlers?: Record<string, ActionHandler>;
  },
): void {
  console.log(`🚀 Initializing app: ${config.name}`);

  // Log configuration options
  if (config.options) {
    console.log(`📋 App options:`, config.options);
  }

  // Register all handlers from menu actions
  Object.values(config.menus).forEach((menu) => {
    menu.actions.forEach((action) => {
      if (action.handler) {
        // Wrap handler to automatically show last menu if showNavigationOptions is true
        const wrappedHandler = async (ctx: MessageContext) => {
          await action.handler?.(ctx);
          if (action.showNavigationOptions) {
            await showLastMenu(ctx);
          }
        };
        registerAction(action.id, wrappedHandler);
        console.log(
          `✅ Registered handler for action: ${action.id}${action.showNavigationOptions ? " (with auto-navigation)" : ""}`,
        );
      }
    });
  });

  // Register any deferred handlers
  if (options?.deferredHandlers) {
    Object.entries(options.deferredHandlers).forEach(([actionId, handler]) => {
      registerAction(actionId, handler);
      console.log(`✅ Registered deferred handler for action: ${actionId}`);
    });
  }

  // Auto-register menu navigation actions (for actions without handlers that match menu IDs)
  Object.values(config.menus).forEach((menu) => {
    menu.actions.forEach((action) => {
      if (!action.handler && config.menus[action.id]) {
        // This action navigates to another menu
        registerAction(action.id, async (ctx: MessageContext) => {
          await showMenu(ctx, config, action.id);
        });
        console.log(`✅ Auto-registered navigation for menu: ${action.id}`);
      }
    });
  });

  // Auto-register common navigation actions
  registerAction("main-menu", async (ctx: MessageContext) => {
    await showMenu(ctx, config, "main-menu");
  });

  registerAction("help", async (ctx: MessageContext) => {
    await showMenu(ctx, config, "main-menu");
  });

  registerAction("back-to-main", async (ctx: MessageContext) => {
    await showMenu(ctx, config, "main-menu");
  });
}
