export class ClientNotFoundError extends Error {
  constructor(context: string) {
    super(`XMTP client is required when ${context}`);
  }
}

export const isGetInboxIdsRequestError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('endpoint "get_inbox_ids"') &&
    error.message.includes("error sending request")
  );
};
