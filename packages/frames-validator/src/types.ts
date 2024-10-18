import type {
  OpenFramesTrustedData,
  OpenFramesUntrustedData,
} from "@open-frames/types";
import type { frames } from "@xmtp/proto";

export type UntrustedData = OpenFramesUntrustedData & {
  walletAddress: string; // Untrusted version of the wallet address
  opaqueConversationIdentifier: string; // A hash of the conversation topic and the participants
};

export type XmtpOpenFramesRequest = {
  clientProtocol: `xmtp@${string}`;
  untrustedData: UntrustedData;
  trustedData: OpenFramesTrustedData;
};

export type XmtpValidationResponse = {
  actionBody: frames.FrameActionBody;
  verifiedWalletAddress: string;
};
