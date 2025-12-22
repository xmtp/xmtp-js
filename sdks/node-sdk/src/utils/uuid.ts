import { randomBytes } from "node:crypto";

/**
 * Generates a unique identifier using crypto.randomBytes()
 */
export const uuid = (): string => randomBytes(16).toString("hex");
