export type FramesApiResponse = {
  url: string;
  extractedTags: { [k: string]: string };
};

export type FramePostUntrustedData = {
  walletAddress: string;
  url: string;
  messageId: string;
  timestamp: number;
  buttonIndex: number;
  conversationIdentifier: string;
};

export type FramePostTrustedData = {
  messageBytes: string;
};

export type FramePostPayload = {
  untrustedData: FramePostUntrustedData;
  trustedData: FramePostTrustedData;
};
