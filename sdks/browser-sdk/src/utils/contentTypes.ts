import init, {
  contentTypeActions as wasmContentTypeActions,
  contentTypeAttachment as wasmContentTypeAttachment,
  contentTypeGroupUpdated as wasmContentTypeGroupUpdated,
  contentTypeIntent as wasmContentTypeIntent,
  contentTypeLeaveRequest as wasmContentTypeLeaveRequest,
  contentTypeMarkdown as wasmContentTypeMarkdown,
  contentTypeMultiRemoteAttachment as wasmContentTypeMultiRemoteAttachment,
  contentTypeReaction as wasmContentTypeReaction,
  contentTypeReadReceipt as wasmContentTypeReadReceipt,
  contentTypeRemoteAttachment as wasmContentTypeRemoteAttachment,
  contentTypeReply as wasmContentTypeReply,
  contentTypeText as wasmContentTypeText,
  contentTypeTransactionReference as wasmContentTypeTransactionReference,
  contentTypeWalletSendCalls as wasmContentTypeWalletSendCalls,
  decryptAttachment as wasmDecryptAttachment,
  encodeActions as wasmEncodeActions,
  encodeAttachment as wasmEncodeAttachment,
  encodeIntent as wasmEncodeIntent,
  encodeMarkdown as wasmEncodeMarkdown,
  encodeMultiRemoteAttachment as wasmEncodeMultiRemoteAttachment,
  encodeReaction as wasmEncodeReaction,
  encodeReadReceipt as wasmEncodeReadReceipt,
  encodeRemoteAttachment as wasmEncodeRemoteAttachment,
  encodeText as wasmEncodeText,
  encodeTransactionReference as wasmEncodeTransactionReference,
  encodeWalletSendCalls as wasmEncodeWalletSendCalls,
  encryptAttachment as wasmEncryptAttachment,
} from "@xmtp/wasm-bindings";

const initPromise = init();

const wrap =
  <T extends (...args: never[]) => unknown>(fn: T) =>
  async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await initPromise;
    return fn(...args) as ReturnType<T>;
  };

// encoders
export const encodeActions = wrap(wasmEncodeActions);
export const encodeAttachment = wrap(wasmEncodeAttachment);
export const encodeIntent = wrap(wasmEncodeIntent);
export const encodeMarkdown = wrap(wasmEncodeMarkdown);
export const encodeMultiRemoteAttachment = wrap(
  wasmEncodeMultiRemoteAttachment,
);
export const encodeReaction = wrap(wasmEncodeReaction);
export const encodeReadReceipt = wrap(wasmEncodeReadReceipt);
export const encodeRemoteAttachment = wrap(wasmEncodeRemoteAttachment);
export const encodeText = wrap(wasmEncodeText);
export const encodeTransactionReference = wrap(wasmEncodeTransactionReference);
export const encodeWalletSendCalls = wrap(wasmEncodeWalletSendCalls);

// content types
export const contentTypeActions = wrap(wasmContentTypeActions);
export const contentTypeAttachment = wrap(wasmContentTypeAttachment);
export const contentTypeGroupUpdated = wrap(wasmContentTypeGroupUpdated);
export const contentTypeIntent = wrap(wasmContentTypeIntent);
export const contentTypeLeaveRequest = wrap(wasmContentTypeLeaveRequest);
export const contentTypeMarkdown = wrap(wasmContentTypeMarkdown);
export const contentTypeMultiRemoteAttachment = wrap(
  wasmContentTypeMultiRemoteAttachment,
);
export const contentTypeReaction = wrap(wasmContentTypeReaction);
export const contentTypeReadReceipt = wrap(wasmContentTypeReadReceipt);
export const contentTypeRemoteAttachment = wrap(
  wasmContentTypeRemoteAttachment,
);
export const contentTypeReply = wrap(wasmContentTypeReply);
export const contentTypeText = wrap(wasmContentTypeText);
export const contentTypeTransactionReference = wrap(
  wasmContentTypeTransactionReference,
);
export const contentTypeWalletSendCalls = wrap(wasmContentTypeWalletSendCalls);

// remote attachment encryption
export const encryptAttachment = wrap(wasmEncryptAttachment);
export const decryptAttachment = wrap(wasmDecryptAttachment);
