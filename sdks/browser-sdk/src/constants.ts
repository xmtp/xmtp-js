/**
 * Pre-configured URLs for the XMTP network based on the environment
 *
 * @constant
 * @property {string} local - The local URL for the XMTP network
 * @property {string} dev - The development URL for the XMTP network
 * @property {string} production - The production URL for the XMTP network
 */
export const ApiUrls = {
  local: "http://localhost:5555",
  dev: "https://dev.xmtp.network",
  production: "https://production.xmtp.network",
} as const;

/**
 * Pre-configured URLs for the XMTP history sync service based on the environment
 *
 * @constant
 * @property {string} local - The local URL for the XMTP history sync service
 * @property {string} dev - The development URL for the XMTP history sync service
 * @property {string} production - The production URL for the XMTP history sync service
 */
export const HistorySyncUrls = {
  local: "http://localhost:5558",
  dev: "https://message-history.dev.ephemera.network",
  production: "https://message-history.production.ephemera.network",
} as const;
