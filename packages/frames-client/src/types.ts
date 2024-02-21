import type { OpenFramesUntrustedData } from "@open-frames/types";
import type {
  GetMetadataResponse,
  PostRedirectResponse,
} from "@open-frames/proxy-client";

export type FramesApiResponse = GetMetadataResponse;

export type FramesApiRedirectResponse = PostRedirectResponse;

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
} & ConversationActionInputs;

type KeyType = {
  kind: "identity" | "prekey";
  prekeyIndex?: number | undefined;
};

export type ReactNativeClient = {
  address: string;
  exportPublicKeyBundle(): Promise<Uint8Array>;
  sign(digest: Uint8Array, type: KeyType): Promise<Uint8Array>;
};
