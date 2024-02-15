import type { Client } from "@xmtp/xmtp-js";
import { frames } from "@xmtp/proto";
import { sha256 } from "@noble/hashes/sha256";
import Long from "long";
import { PROTOCOL_VERSION } from "./constants";
import type { FrameActionInputs, FramePostPayload } from "./types";
import { v1ToV2Bundle } from "./converters";
import { base64Encode, buildOpaqueIdentifier } from "./utils";
import OpenFramesProxy from "./proxy";

export class FramesClient {
  xmtpClient: Client;

  proxy: OpenFramesProxy;

  constructor(xmtpClient: Client, proxy?: OpenFramesProxy) {
    this.xmtpClient = xmtpClient;
    this.proxy = proxy || new OpenFramesProxy();
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
      clientProtocol: `xmtp@${PROTOCOL_VERSION}`,
      untrustedData: {
        buttonIndex,
        opaqueConversationIdentifier,
        walletAddress: this.xmtpClient.address,
        url: frameUrl,
        timestamp: now,
        unixTimestamp: now,
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
