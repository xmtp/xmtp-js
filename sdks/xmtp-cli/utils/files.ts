/**
 * Enhanced file utilities for XMTP skills
 * Provides file operations, JSON handling, directory management, and environment handling
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  withErrorHandling,
  withSyncErrorHandling,
  createError,
  logger,
} from "../core/agent.js";

/**
 * Read JSON file with error handling
 */
export function readJsonFile<T = any>(filePath: string): T | undefined {
  return withSyncErrorHandling(
    () => {
      if (!fs.existsSync(filePath)) {
        return undefined;
      }
      const content = fs.readFileSync(filePath, "utf8");
      return JSON.parse(content) as T;
    },
    `Failed to read JSON file ${filePath}`,
    undefined,
  );
}

/**
 * Write JSON file with error handling
 */
export function writeJsonFile(filePath: string, data: any): void {
  withSyncErrorHandling(() => {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }, `Failed to write JSON file ${filePath}`);
}

/**
 * Check if directory exists, create if it doesn't
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Clean up files matching a pattern in a directory
 */
export function cleanupFiles(
  directory: string,
  pattern: RegExp | string,
): number {
  if (!fs.existsSync(directory)) {
    return 0;
  }

  return withSyncErrorHandling(
    () => {
      const files = fs.readdirSync(directory);
      const matchingFiles = files.filter((file) => {
        if (typeof pattern === "string") {
          return file.includes(pattern);
        }
        return pattern.test(file);
      });

      let removedCount = 0;
      for (const file of matchingFiles) {
        const filePath = path.join(directory, file);
        fs.unlinkSync(filePath);
        removedCount++;
      }

      return removedCount;
    },
    `Error during cleanup in ${directory}`,
    0,
  );
}

/**
 * Get files in directory matching a pattern
 */
export function getFilesInDirectory(
  directory: string,
  pattern?: RegExp | string,
): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return withSyncErrorHandling(
    () => {
      const files = fs.readdirSync(directory);

      if (!pattern) {
        return files;
      }

      return files.filter((file) => {
        if (typeof pattern === "string") {
          return file.includes(pattern);
        }
        return pattern.test(file);
      });
    },
    `Error reading directory ${directory}`,
    [],
  );
}

/**
 * Read environment variables from .env file
 */
export async function readEnvFile(
  envPath: string,
): Promise<Record<string, string>> {
  return withErrorHandling(async () => {
    if (!fs.existsSync(envPath)) {
      throw createError(
        `Environment file not found: ${envPath}`,
        "Environment file reading",
      );
    }

    const content = await fs.promises.readFile(envPath, "utf-8");
    const envVars: Record<string, string> = {};

    content.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value && !key.startsWith("#")) {
        envVars[key.trim()] = value.trim();
      }
    });

    return envVars;
  }, "Failed to read environment file");
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(
  envVars: Record<string, string>,
  required: string[],
): void {
  const missing = required.filter((varName) => !envVars[varName]);

  if (missing.length > 0) {
    throw createError(
      `Missing required environment variables: ${missing.join(", ")}`,
      "Environment validation",
    );
  }
}

/**
 * Load and validate environment variables from .env file
 */
export async function loadEnvironmentConfig(
  envPath: string = ".env",
): Promise<Record<string, string>> {
  const envVars = await readEnvFile(envPath);

  // Validate required XMTP environment variables
  const requiredVars = ["XMTP_WALLET_KEY", "XMTP_ENV"];
  validateEnvVars(envVars, requiredVars);

  logger.success(`Environment loaded from ${envPath}`);
  return envVars;
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined && fallback === undefined) {
    throw createError(
      `Environment variable ${name} is required`,
      "Environment validation",
    );
  }
  return value || fallback || "";
}

/**
 * Get boolean environment variable
 */
export function getBooleanEnvVar(
  name: string,
  fallback: boolean = false,
): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Get number environment variable
 */
export function getNumberEnvVar(name: string, fallback?: number): number {
  const value = process.env[name];
  if (value === undefined) {
    if (fallback === undefined) {
      throw createError(
        `Environment variable ${name} is required`,
        "Environment validation",
      );
    }
    return fallback;
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw createError(
      `Environment variable ${name} must be a number, got: ${value}`,
      "Environment validation",
    );
  }

  return parsed;
}
