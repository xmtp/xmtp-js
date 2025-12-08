import type { XmtpEnv } from "@xmtp/browser-sdk";

export const isValidEthereumAddress = (
  address: string,
): address is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(address);

export const isValidInboxId = (inboxId: string): inboxId is string =>
  /^[a-z0-9]{64}$/.test(inboxId);

export const shortAddress = (address: string, length: number = 4): string => {
  if (!isValidEthereumAddress(address) && !isValidInboxId(address)) {
    return address;
  }
  return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
};

export const MEMBER_NO_LONGER_IN_GROUP =
  "This member is no longer in the group";

export const isValidEnvironment = (env: string): env is XmtpEnv =>
  ["production", "dev", "local"].includes(env);
