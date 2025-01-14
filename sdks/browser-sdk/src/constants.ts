export const ApiUrls = {
  local: "http://localhost:5555",
  dev: "https://dev.xmtp.network",
  production: "https://production.xmtp.network",
} as const;

export const HistorySyncUrls = {
  local: "http://localhost:5558",
  dev: "https://message-history.dev.ephemera.network",
  production: "https://message-history.production.ephemera.network",
} as const;
