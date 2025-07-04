export const isValidEthereumAddress = (
  address: string,
): address is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(address);

export const isValidInboxId = (inboxId: string): inboxId is string =>
  /^[a-z0-9]{64}$/.test(inboxId);

export const shortAddress = (address: string): string =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

export const extractIboxIdFromMaxInstallationsError = (
  error: Error,
): string | null => {
  if (error.message.includes("Cannot register a new installation")) {
    const regex = /InboxID ([a-f0-9]+)/;
    const match = error.message.match(regex);
    if (match && match[1]) {
      return match[1];
    } else {
      console.log("InboxID not found.");
    }
  }
  return null;
};
