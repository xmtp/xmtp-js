import { fromString } from "uint8arrays";

export const isHexString = (input: unknown): input is `0x${string}` => {
  if (input && typeof input === "string" && input.startsWith("0x")) {
    return true;
  }
  return false;
};

/**
 * Convert a hex string to a Uint8Array encryption key.
 * @param hex - The hex string
 * @returns The encryption key
 */
export const getEncryptionKeyFromHex = (hex: string): Uint8Array => {
  return fromString(hex, "hex");
};
