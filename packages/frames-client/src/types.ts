import type { OpenFramesUntrustedData } from "@open-frames/types";

export type FramesApiResponse = {
  url: string;
  extractedTags: { [k: string]: string };
};

export type FramesApiRedirectResponse = {
  originalUrl: string;
  redirectedTo: string;
};

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
