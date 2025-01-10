export class ClientNotFoundError extends Error {
  constructor(context: string) {
    super(`XMTP client is required when ${context}`);
  }
}
