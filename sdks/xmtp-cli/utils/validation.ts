/**
 * Shared validation utilities for XMTP skills
 * Provides common validation functions for addresses, IDs, and other inputs
 */

import { createError } from "../core/agent.js";

/**
 * Validate Ethereum address format
 */
export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate inbox ID format (64 hex characters)
 */
export function validateInboxId(inboxId: string): boolean {
  return /^[a-f0-9]{64}$/i.test(inboxId);
}

/**
 * Validate installation ID format (64 hex characters)
 */
export function validateInstallationId(installationId: string): boolean {
  return /^[a-f0-9]{64}$/i.test(installationId);
}

/**
 * Validate group ID format
 */
export function validateGroupId(groupId: string): boolean {
  // Group IDs can vary in format, so we'll be more lenient
  return groupId.length > 0 && /^[a-f0-9]+$/i.test(groupId);
}

/**
 * Validate private key format
 */
export function validatePrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}

/**
 * Validate encryption key format
 */
export function validateEncryptionKey(encryptionKey: string): boolean {
  return /^[a-f0-9]{64}$/i.test(encryptionKey);
}

/**
 * Validate environment name
 */
export function validateEnvironment(env: string): boolean {
  return ["local", "dev", "production"].includes(env.toLowerCase());
}

/**
 * Validate positive integer
 */
export function validatePositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw createError(
      `${fieldName} must be a positive integer, got: ${value}`,
      "Validation",
    );
  }
}

/**
 * Validate non-negative integer
 */
export function validateNonNegativeInteger(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value < 0) {
    throw createError(
      `${fieldName} must be a non-negative integer, got: ${value}`,
      "Validation",
    );
  }
}

/**
 * Validate string is not empty
 */
export function validateNonEmptyString(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw createError(`${fieldName} cannot be empty`, "Validation");
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate comma-separated list
 */
export function validateCommaSeparatedList(
  value: string,
  validator: (item: string) => boolean,
): string[] {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  for (const item of items) {
    if (!validator(item)) {
      throw createError(`Invalid item in list: ${item}`, "List validation");
    }
  }

  return items;
}

/**
 * Validate that at least one of the provided values is set
 */
export function validateAtLeastOne(
  values: Record<string, unknown>,
  fieldNames: string[],
): void {
  const hasValue = fieldNames.some(
    (name) =>
      values[name] !== undefined &&
      values[name] !== null &&
      values[name] !== "",
  );

  if (!hasValue) {
    throw createError(
      `At least one of the following must be provided: ${fieldNames.join(", ")}`,
      "Validation",
    );
  }
}

/**
 * Validate that exactly one of the provided values is set
 */
export function validateExactlyOne(
  values: Record<string, unknown>,
  fieldNames: string[],
): void {
  const setValues = fieldNames.filter(
    (name) =>
      values[name] !== undefined &&
      values[name] !== null &&
      values[name] !== "",
  );

  if (setValues.length === 0) {
    throw createError(
      `Exactly one of the following must be provided: ${fieldNames.join(", ")}`,
      "Validation",
    );
  }

  if (setValues.length > 1) {
    throw createError(
      `Only one of the following can be provided: ${fieldNames.join(", ")}`,
      "Validation",
    );
  }
}
