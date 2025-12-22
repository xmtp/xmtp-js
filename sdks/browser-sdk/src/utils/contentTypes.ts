import init, {
  actionsContentType as wasmActionsContentType,
  attachmentContentType as wasmAttachmentContentType,
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
  groupUpdatedContentType as wasmGroupUpdatedContentType,
  intentContentType as wasmIntentContentType,
  markdownContentType as wasmMarkdownContentType,
  multiRemoteAttachmentContentType as wasmMultiRemoteAttachmentContentType,
  reactionContentType as wasmReactionContentType,
  readReceiptContentType as wasmReadReceiptContentType,
  remoteAttachmentContentType as wasmRemoteAttachmentContentType,
  replyContentType as wasmReplyContentType,
  textContentType as wasmTextContentType,
  transactionReferenceContentType as wasmTransactionReferenceContentType,
  walletSendCallsContentType as wasmWalletSendCallsContentType,
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
export const actionsContentType = wrap(wasmActionsContentType);
export const attachmentContentType = wrap(wasmAttachmentContentType);
export const groupUpdatedContentType = wrap(wasmGroupUpdatedContentType);
export const intentContentType = wrap(wasmIntentContentType);
export const markdownContentType = wrap(wasmMarkdownContentType);
export const multiRemoteAttachmentContentType = wrap(
  wasmMultiRemoteAttachmentContentType,
);
export const reactionContentType = wrap(wasmReactionContentType);
export const readReceiptContentType = wrap(wasmReadReceiptContentType);
export const remoteAttachmentContentType = wrap(
  wasmRemoteAttachmentContentType,
);
export const replyContentType = wrap(wasmReplyContentType);
export const textContentType = wrap(wasmTextContentType);
export const transactionReferenceContentType = wrap(
  wasmTransactionReferenceContentType,
);
export const walletSendCallsContentType = wrap(wasmWalletSendCallsContentType);

// remote attachment encryption
export const encryptAttachment = wrap(wasmEncryptAttachment);
export const decryptAttachment = wrap(wasmDecryptAttachment);
