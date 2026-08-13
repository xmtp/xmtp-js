const IGNORED_ERROR_MESSAGES = ["runtime.sendMessage"];

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return undefined;
};

export const shouldIgnoreError = (error: unknown) => {
  const message = getErrorMessage(error);
  if (!message) {
    return false;
  }
  return IGNORED_ERROR_MESSAGES.some((ignoredMessage) =>
    message.includes(ignoredMessage),
  );
};
