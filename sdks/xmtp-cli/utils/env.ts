/**
 * Environment variable loading utilities
 * Provides .env file loading using Node.js built-ins
 */

import { readFileSync } from "node:fs";
import { loadEnvFile as nodeLoadEnvFile } from "node:process";

/**
 * Load environment variables from .env file
 * Uses Node.js built-in loadEnvFile when available, falls back to manual parsing
 */
export function loadEnv(envPath: string = ".env"): void {
  try {
    // Try using Node.js built-in (Node 20.6+)
    if (typeof nodeLoadEnvFile === "function") {
      nodeLoadEnvFile(envPath);
      return;
    }
  } catch {
    // Fall back to manual parsing if loadEnvFile is not available or fails
  }

  // Manual parsing fallback
  try {
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const equalIndex = trimmedLine.indexOf("=");
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, equalIndex).trim();
      const value = trimmedLine.slice(equalIndex + 1).trim();

      // Remove quotes if present
      const unquotedValue = value.replace(/^["']|["']$/g, "");

      if (key && !process.env[key]) {
        process.env[key] = unquotedValue;
      }
    }
  } catch {
    // Silently fail if .env file doesn't exist
  }
}

/**
 * Load .env file from current working directory or specified path
 */
export function loadEnvFile(path?: string): void {
  loadEnv(path);
}
