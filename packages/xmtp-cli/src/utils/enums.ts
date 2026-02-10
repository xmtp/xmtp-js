import { ConsentState, ConversationType, IdentifierKind } from "@xmtp/node-sdk";

export const identifierKindMap: Record<string, IdentifierKind> = {
  ethereum: IdentifierKind.Ethereum,
  passkey: IdentifierKind.Passkey,
};

export const consentStateMap: Record<string, ConsentState> = {
  allowed: ConsentState.Allowed,
  denied: ConsentState.Denied,
  unknown: ConsentState.Unknown,
};

export const conversationTypeMap: Record<string, ConversationType> = {
  dm: ConversationType.Dm,
  group: ConversationType.Group,
};
