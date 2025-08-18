import { type DecodedMessage } from "@xmtp/browser-sdk";

export const isValidEthereumAddress = (
  address: string,
): address is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(address);

export const isValidInboxId = (inboxId: string): inboxId is string =>
  /^[a-z0-9]{64}$/.test(inboxId);

export const shortAddress = (address: string): string =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

export const stringifyMessage = (message: DecodedMessage) => {
  if (message["content"]) {
    if (typeof message.content === "object" && "content" in message.content) {
      return String(message.content.content);
    }
    return String(message.content);
  }
  return message.fallback ? message.fallback : String(message);
};
