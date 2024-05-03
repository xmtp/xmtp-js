/**
 *
 * @param peerAddress - Ethereum address of the broadcaster
 * @param timestampMs - Timestamp in milliseconds used in the signature
 * @returns
 */
export const createConsentMessage = (
  peerAddress: string,
  timestampMs: number,
): string =>
  "XMTP : Grant inbox consent to sender\n" +
  "\n" +
  `Current Time: ${timestampMs}\n` +
  `From Address: ${peerAddress}\n` +
  "\n" +
  "For more info: https://xmtp.org/signatures/";
