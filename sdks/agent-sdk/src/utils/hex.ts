import type { HexString } from "@xmtp/node-sdk";

// Regex patterns for hex string validation
// Hex strings must have an even number of digits (each byte = 2 hex digits)
const HEX_WITH_PREFIX_PATTERN = /^0x(?:[0-9a-fA-F]{2})+$/;
const HEX_WITHOUT_PREFIX_PATTERN = /^(?:[0-9a-fA-F]{2})+$/;

/**
 * Normalizes a hex string by ensuring it has a '0x' prefix.
 * If the input already has '0x', returns it as-is.
 * If the input doesn't have '0x', adds it.
 *
 * Note: Hex strings must have an even number of hex digits (excluding the '0x' prefix)
 * because each byte is represented by exactly 2 hexadecimal digits.
 * This is required for cryptographic keys and other byte-based data.
 *
 * @param value - The hex string to normalize (with or without '0x' prefix)
 * @returns The normalized hex string with '0x' prefix
 * @throws TypeError if the value is not a valid hex string
 */
export function ensureHexPrefix(value: string): HexString {
  if (typeof value !== "string") {
    throw new TypeError("Value must be a string");
  }

  const trimmedValue = value.trim();

  // If already has 0x prefix, validate and return
  if (trimmedValue.startsWith("0x")) {
    if (!HEX_WITH_PREFIX_PATTERN.test(trimmedValue)) {
      throw new TypeError(
        "Invalid hex string format. Expected format: 0x followed by even number of hex digits",
      );
    }
    return trimmedValue as HexString;
  }

  // If no 0x prefix, validate the raw hex and add prefix
  if (!HEX_WITHOUT_PREFIX_PATTERN.test(trimmedValue)) {
    throw new TypeError(
      "Invalid hex string format. Expected even number of hex digits (with or without 0x prefix)",
    );
  }

  return `0x${trimmedValue}`;
}
