import type {
  GetMetadataResponse,
  PostRedirectResponse,
  TransactionResponse,
} from "@open-frames/proxy-client";
import type { OpenFramesUntrustedData } from "@open-frames/types";
import {
  type publicKey as publicKeyProto,
  type signature as signatureProto,
} from "@xmtp/proto";

export type FramesApiResponse = GetMetadataResponse;

export type FramesApiRedirectResponse = PostRedirectResponse;

export type FramesTransactionApiResponse = TransactionResponse;

export type FramePostUntrustedData = OpenFramesUntrustedData & {
  walletAddress: string; // Untrusted version of the wallet address
  opaqueConversationIdentifier: string; // A hash of the conversation topic and the participants
  unixTimestamp: number;
};

export type FramePostTrustedData = {
  messageBytes: string;
};

export type FramePostPayload = {
  clientProtocol: `xmtp@${string}`;
  untrustedData: FramePostUntrustedData;
  trustedData: FramePostTrustedData;
};

type DmActionInputs = {
  conversationTopic: string;
  participantAccountAddresses: string[];
};

type GroupActionInputs = {
  groupId: Uint8Array;
  groupSecret: Uint8Array;
};

type ConversationActionInputs = DmActionInputs | GroupActionInputs;

export type FrameActionInputs = {
  frameUrl: string;
  buttonIndex: number;
  inputText?: string;
  state?: string;
  address?: string;
  transactionId?: string;
} & ConversationActionInputs;

export type V2FramesSigner = {
  address: () => Promise<string> | string;
  getPublicKeyBundle: () => Promise<publicKeyProto.PublicKeyBundle>;
  sign: (message: Uint8Array) => Promise<signatureProto.Signature>;
};

export type V3FramesSigner = {
  installationId: () => Promise<Uint8Array> | Uint8Array;
  inboxId: () => Promise<string> | string;
  address: () => Promise<string> | string;
  sign: (message: Uint8Array) => Promise<Uint8Array> | Uint8Array;
};

export type FramesSigner = V2FramesSigner | V3FramesSigner;

export const isV3FramesSigner = (
  signer: FramesSigner,
): signer is V3FramesSigner => {
  return "installationId" in signer && "inboxId" in signer;
};
