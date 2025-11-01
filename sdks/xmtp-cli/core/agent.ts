import { createRequire } from "node:module";
import { Agent } from "@xmtp/agent-sdk";
import { MarkdownCodec } from "@xmtp/content-type-markdown";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { WalletSendCallsCodec } from "@xmtp/content-type-wallet-send-calls";

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

/**
 * Create a standardized error with context
 */
export function createError(
  message: string,
  context?: string,
  originalError?: unknown,
): Error {
  const fullMessage = context ? `${context}: ${message}` : message;
  const error = new Error(fullMessage);

  if (originalError) {
    error.cause = originalError;
  }

  return error;
}

/**
 * Wrap async operations with consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const wrappedError = createError(errorMessage, context, error);

    if (fallback !== undefined) {
      console.warn(`⚠️  ${context} failed, using fallback: ${errorMessage}`);
      return fallback;
    }

    throw wrappedError;
  }
}

/**
 * Wrap sync operations with consistent error handling
 */
export function withSyncErrorHandling<T>(
  operation: () => T,
  context: string,
  fallback?: T,
): T {
  try {
    return operation();
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const wrappedError = createError(errorMessage, context, error);

    if (fallback !== undefined) {
      console.warn(`⚠️  ${context} failed, using fallback: ${errorMessage}`);
      return fallback;
    }

    throw wrappedError;
  }
}

/**
 * Retry operation with exponential backoff and error handling
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${context} (attempt ${attempt}/${maxRetries})`);
      const result = await operation();
      console.log(`✅ ${context} completed successfully`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.log(`❌ ${context} failed: ${getErrorMessage(error)}`);

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw createError(`Failed all ${maxRetries} attempts`, context, lastError);
}

// ============================================================================
// LOGGING
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: "info",
  timestamp: false,
};

/**
 * Logger class with consistent formatting
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    emoji?: string,
  ): string {
    const timestamp = this.config.timestamp
      ? `[${new Date().toISOString()}] `
      : "";
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : "";
    const icon = emoji ? `${emoji} ` : "";

    return `${timestamp}${prefix}${icon}${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  debug(message: string): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, "🐛"));
    }
  }

  info(message: string): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, "ℹ️"));
    }
  }

  warn(message: string): void {
    if (this.shouldLog("warn")) {
      console.log(this.formatMessage("warn", message, "⚠️"));
    }
  }

  error(message: string): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, "❌"));
    }
  }

  success(message: string): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, "✅"));
    }
  }

  operationStart(operation: string, details?: string): void {
    const message = details
      ? `Starting ${operation}: ${details}`
      : `Starting ${operation}`;
    this.info(this.formatMessage("info", message, "🚀"));
  }

  operationSuccess(operation: string, details?: string): void {
    const message = details
      ? `${operation} completed successfully: ${details}`
      : `${operation} completed successfully`;
    this.success(message);
  }

  operationFailure(operation: string, error: Error | string): void {
    const errorMessage =
      error instanceof Error ? error.message : (error ?? "unknown");
    this.error(`${operation} failed: ${errorMessage}`);
  }

  sectionHeader(title: string): void {
    if (this.shouldLog("info")) {
      console.log(`\n${title}`);
      console.log("─".repeat(title.length));
    }
  }

  summary(data: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.log("\n📊 Summary:");
      for (const [key, value] of Object.entries(data)) {
        const displayValue =
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : value === null || value === undefined
              ? ""
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value);
        console.log(`   ${key}: ${displayValue}`);
      }
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Convenience functions using global logger
 */
export const logDebug = (message: string): void => {
  logger.debug(message);
};
export const logInfo = (message: string): void => {
  logger.info(message);
};
export const logWarning = (message: string): void => {
  logger.warn(message);
};
export const logError = (message: string): void => {
  logger.error(message);
};
export const logSuccess = (message: string): void => {
  logger.success(message);
};
export const logOperationStart = (operation: string, details?: string) => {
  logger.operationStart(operation, details);
};
export const logOperationSuccess = (operation: string, details?: string) => {
  logger.operationSuccess(operation, details);
};
export const logOperationFailure = (
  operation: string,
  error: Error | string,
) => {
  logger.operationFailure(operation, error);
};
export const logSectionHeader = (title: string) => {
  logger.sectionHeader(title);
};
export const createSummaryTable = (data: Record<string, unknown>) => {
  logger.summary(data);
};

/**
 * Format utilities
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2);
    return `${minutes}m ${seconds}s`;
  }
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Progress bar class for CLI operations
 */
export class ProgressBar {
  private total: number;
  private current: number = 0;
  private message: string;

  constructor(total: number, message: string) {
    this.total = total;
    this.message = message;
  }

  update(current?: number): void {
    if (current !== undefined) {
      this.current = current;
    } else {
      this.current++;
    }

    const percentage = Math.round((this.current / this.total) * 100);
    const filled = Math.round((this.current / this.total) * 20);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);

    process.stdout.write(
      `\r${this.message} [${bar}] ${percentage}% (${this.current}/${this.total})`,
    );

    if (this.current === this.total) {
      process.stdout.write("\n");
    }
  }

  finish(): void {
    this.update(this.total);
  }
}

/**
 * Retry function with exponential backoff (alias for backward compatibility)
 */
export const runWithRetry = retryWithBackoff;

// ============================================================================
// AGENT UTILITIES
// ============================================================================

/**
 * Get agent instance with error handling
 */
export async function getAgentInstance(): Promise<Agent> {
  return withErrorHandling(() => getAgent(), "Failed to create agent");
}

export async function getAgent(): Promise<Agent> {
  if (!agentInstance) {
    agentInstance = await Agent.createFromEnv({
      dbPath: (inboxId: string) =>
        `${process.env.RAILWAY_VOLUME_MOUNT_PATH ?? ".xmtp"}/${process.env.XMTP_ENV}-${inboxId.slice(0, 8)}.db3`,
      codecs: [
        new MarkdownCodec(),
        new ReactionCodec(),
        new ReplyCodec(),
        new RemoteAttachmentCodec(),
        new AttachmentCodec(),
        new WalletSendCallsCodec(),
      ],
    });
  }
  return agentInstance;
}
/**
 * Validate agent instance and log basic info
 */
export function validateAgent(agent: Agent): void {
  if (!agent) {
    throw createError(
      "Agent instance is null or undefined",
      "Agent validation",
    );
  }

  if (!agent.client) {
    throw createError("Agent client is null or undefined", "Agent validation");
  }

  if (!agent.client.inboxId) {
    throw createError(
      "Agent inbox ID is null or undefined",
      "Agent validation",
    );
  }

  logger.success(`Agent created: ${agent.client.inboxId}`);
}

/**
 * Get agent with validation and logging
 */
export async function getValidatedAgent(): Promise<Agent> {
  const agent = await getAgentInstance();
  validateAgent(agent);
  return agent;
}

/**
 * Check if current user has required permissions in a group
 */
export async function checkGroupPermissions(
  agent: Agent,
  groupId: string,
  requiredRole: "admin" | "super-admin" = "admin",
): Promise<boolean> {
  return withErrorHandling(async () => {
    const group = await agent.client.conversations.getConversationById(groupId);
    if (!group) {
      throw createError(
        `Group not found: ${groupId}`,
        "Group permissions check",
      );
    }

    const currentUser = agent.client.inboxId;

    if ("isSuperAdmin" in group && typeof group.isSuperAdmin === "function") {
      if (requiredRole === "super-admin") {
        return group.isSuperAdmin(currentUser);
      }
    }
    if ("isAdmin" in group && typeof group.isAdmin === "function") {
      return group.isAdmin(currentUser);
    }
    return false;
  }, "Failed to check group permissions");
}

let agentInstance: Agent | null = null;

// Type definitions for inbox data
export interface InboxData {
  accountAddress: string;
  walletKey: string;
  dbEncryptionKey: string;
  inboxId: string;
  installations: number;
}

// Load inboxes.json using createRequire for ES modules
const require = createRequire(import.meta.url);
const newInboxes2 = require("./inboxes.json") as InboxData[];
const typedInboxes2 = newInboxes2;

function getInboxByInstallationCount(installationCount: number, index: number) {
  if (installationCount === 2) {
    return typedInboxes2.slice(0, index);
  }
  return typedInboxes2;
}

export function getInboxes(
  count: number,
  installationCount: number = 2,
  maxIndex: number = 200,
) {
  const pool = getInboxByInstallationCount(installationCount, maxIndex);
  return pool
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((inbox) => inbox);
}

/**
 * Get random account addresses from inboxes.json
 * @param count Number of random addresses to return
 * @param installationCount Filter by installation count (default: 2)
 * @param maxIndex Maximum index to consider from the pool (default: 200)
 * @returns Array of account addresses
 */
export function getRandomAccountAddresses(
  count: number,
  installationCount: number = 2,
  maxIndex: number = 200,
): string[] {
  const pool = getInboxByInstallationCount(installationCount, maxIndex);
  return pool
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((inbox) => inbox.accountAddress);
}
