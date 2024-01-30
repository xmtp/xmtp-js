import type { Client } from "@xmtp/xmtp-js";
import { frames, fetcher } from "@xmtp/proto";
import { OG_PROXY_URL } from "./constants";
import type { FramePostPayload, FramesApiResponse } from "./types";
import { sha256 } from "./crypto";
import { v1ToV2Bundle } from "./converters";

const { b64Encode } = fetcher;

export class FramesClient {
  xmtpClient: Client;

  constructor(xmtpClient: Client) {
    this.xmtpClient = xmtpClient;
  }

  static async readMetadata(url: string): Promise<FramesApiResponse> {
    const response = await fetch(
      `${OG_PROXY_URL}?url=${encodeURIComponent(url)}`,
    );
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

  async signFrameAction(
    frameUrl: string,
    buttonIndex: number,
    conversationIdentifier: string,
    messageId: string,
  ): Promise<FramePostPayload> {
    const signedAction = await this.buildSignedFrameAction(
      frameUrl,
      buttonIndex,
      conversationIdentifier,
      messageId,
    );

    return {
      untrustedData: {
        walletAddress: this.xmtpClient.address,
        url: frameUrl,
        messageId,
        timestamp: Date.now(),
        buttonIndex,
        conversationIdentifier,
      },
      trustedData: {
        messageBytes: b64Encode(signedAction, 0, signedAction.length),
      },
    };
  }

  private async buildSignedFrameAction(
    frameUrl: string,
    buttonIndex: number,
    conversationIdentifier: string,
    messageId: string,
  ) {
    const actionBody = frames.FrameActionBody.encode({
      frameUrl: new TextEncoder().encode(frameUrl),
      buttonIndex: new TextEncoder().encode(buttonIndex.toString()),
      conversationIdentifier,
      messageId,
    }).finish();

    const digest = await sha256(actionBody);
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
