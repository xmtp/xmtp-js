import { getRandomValues } from "node:crypto";
import { fromString, toString } from "uint8arrays";
import { generatePrivateKey } from "viem/accounts";

/**
 * Convert a hex string to a Uint8Array encryption key.
 * @param hex - The hex string
 * @returns The encryption key
 */
export const getEncryptionKeyFromHex = (hex: string): Uint8Array => {
  return fromString(hex, "hex");
};

/**
 * Generates a cryptographically secure random encryption key for database encryption.
 *
 * Creates a 256-bit (32-byte) encryption key using the Node.js crypto module's
 * secure random number generator.
 *
 * @returns A hex-encoded encryption key string (64 characters)
 */
const generateEncryptionKeyHex = () => {
  /* Generate a random encryption key */
  const uint8Array = getRandomValues(new Uint8Array(32));
  /* Convert the encryption key to a hex string */
  return toString(uint8Array, "hex");
};

/**
 * Generates a complete set of client keys required for XMTP agent initialization.
 *
 * Creates both a wallet private key for client authentication and a database
 * encryption key for secure local storage. The returned keys can be used
 * directly as environment variables.
 *
 * @returns An object containing the keys
 */
export const generateClientKeys = () => {
  const walletKey = generatePrivateKey();
  const dbEncryptionKey = generateEncryptionKeyHex();
  return {
    XMTP_DB_ENCRYPTION_KEY: dbEncryptionKey,
    XMTP_WALLET_KEY: walletKey,
  };
};
