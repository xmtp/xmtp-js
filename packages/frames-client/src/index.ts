import type { Client } from "@xmtp/xmtp-js";
import { frames } from "@xmtp/proto";
import { sha256 } from "@noble/hashes/sha256";
import Long from "long";
import { OG_PROXY_URL } from "./constants";
import type {
  FrameActionInputs,
  FramePostPayload,
  FramesApiResponse,
} from "./types";
import { v1ToV2Bundle } from "./converters";
import { ApiError } from "./errors";
import { base64Encode, buildOpaqueIdentifier } from "./utils";

export class FramesClient {
  xmtpClient: Client;

  constructor(xmtpClient: Client) {
    this.xmtpClient = xmtpClient;
  }

  static async readMetadata(url: string): Promise<FramesApiResponse> {
    const response = await fetch(
      `${OG_PROXY_URL}?url=${encodeURIComponent(url)}`,
    );

    if (!response.ok) {
      throw new ApiError(`Failed to read metadata for ${url}`, response.status);
    }

    return (await response.json()) as FramesApiResponse;
  }

  static async postToFrame(
    url: string,
    payload: FramePostPayload,
  ): Promise<FramesApiResponse> {
    const response = await fetch(
      `${OG_PROXY_URL}?url=${encodeURIComponent(url)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to post to frame: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as FramesApiResponse;
  }

  async signFrameAction(inputs: FrameActionInputs): Promise<FramePostPayload> {
    const opaqueConversationIdentifier = buildOpaqueIdentifier(inputs);
    const { frameUrl, buttonIndex } = inputs;
    const now = Date.now();
    const toSign: frames.FrameActionBody = {
      frameUrl,
      buttonIndex,
      opaqueConversationIdentifier,
      timestamp: Long.fromNumber(now),
    };

    const signedAction = await this.buildSignedFrameAction(toSign);

    return {
      untrustedData: {
        buttonIndex,
        opaqueConversationIdentifier,
        walletAddress: this.xmtpClient.address,
        url: frameUrl,
        timestamp: now,
      },
      trustedData: {
        messageBytes: base64Encode(signedAction),
      },
    };
  }

  private async buildSignedFrameAction(
    actionBodyInputs: frames.FrameActionBody,
  ) {
    const actionBody = frames.FrameActionBody.encode(actionBodyInputs).finish();

    const digest = sha256(actionBody);
    const signature = await this.xmtpClient.keystore.signDigest({
      digest,
      identityKey: true,
      prekeyIndex: undefined,
    });

    const publicKeyBundle = await this.xmtpClient.keystore.getPublicKeyBundle();

    return frames.FrameAction.encode({
      actionBody,
      signature,
      signedPublicKeyBundle: v1ToV2Bundle(publicKeyBundle),
    }).finish();
  }
}
