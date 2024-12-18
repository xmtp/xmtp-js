export const isValidLongWalletAddress = (
  address: string,
): address is `0x${string}` =>
  address.startsWith("0x") && address.length === 42;

export const shortAddress = (address: string): string =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
