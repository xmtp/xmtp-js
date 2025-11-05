export type HexString = `0x${string}`;
export function isHexString(value: unknown): value is HexString {
  return typeof value === "string" && /^0x(?:[0-9a-fA-F]{2})+$/.test(value);
}
export function validHex(value: unknown): HexString {
  if (!isHexString(value)) {
    throw new TypeError(`Value is not a hexadecimal string.`);
  }
  return value;
}
