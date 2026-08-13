export const parseWalletSendCallsChainId = (chainId: string) => {
  return chainId.toLowerCase().startsWith("0x")
    ? parseInt(chainId, 16)
    : parseInt(chainId, 10);
};
