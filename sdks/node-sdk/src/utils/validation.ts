export type HexString = `0x${string}`;
export function isHexString(value: unknown): asserts value is HexString {
  if (typeof value !== "string") {
    throw new TypeError("Value must be a string");
  }

  if (value.length % 2 !== 0) {
    throw new TypeError("Invalid hex string length");
  }

  if (!/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new TypeError("Invalid hex string");
  }
}
