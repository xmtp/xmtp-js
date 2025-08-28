export const isHexString = (input: unknown): input is `0x${string}` => {
  if (input && typeof input === "string" && input.startsWith("0x")) {
    return true;
  }
  return false;
};

/**
 * Convert a hex string (with or without 0x) to a Uint8Array encryption key.
 * @param hex - The hex string
 * @returns The encryption key
 */
export const getEncryptionKeyFromHex = (hex: string): Uint8Array => {
  let normalized = isHexString(hex) ? hex.slice(2) : hex;
  if (normalized.length === 0) {
    return new Uint8Array();
  }

  if (normalized.length % 2 !== 0) {
    // pad leading zero if odd length
    normalized = "0" + normalized;
  }
  const len = normalized.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};
