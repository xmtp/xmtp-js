import { sha256 } from "@noble/hashes/sha256";
import { frames } from "@xmtp/proto";
import Long from "long";
import { PROTOCOL_VERSION } from "./constants";
import { v1ToV2Bundle } from "./converters";
import OpenFramesProxy from "./proxy";
import {
  isV3FramesSigner,
  type FrameActionInputs,
  type FramePostPayload,
  type FramesSigner,
} from "./types";
import { base64Encode, buildOpaqueIdentifier } from "./utils";

export class FramesClient {
  #proxy: OpenFramesProxy;
  #signer: FramesSigner;

  constructor(signer: FramesSigner, proxy?: OpenFramesProxy) {
    this.#signer = signer;
    this.#proxy = proxy || new OpenFramesProxy();
  }

  get proxy() {
    return this.#proxy;
  }

  async signFrameAction(inputs: FrameActionInputs): Promise<FramePostPayload> {
    const opaqueConversationIdentifier = buildOpaqueIdentifier(inputs);
    const { frameUrl, buttonIndex, inputText, state, address, transactionId } =
      inputs;
    const now = Date.now();
    const timestamp = Long.fromNumber(now);
    const toSign: frames.FrameActionBody = {
      frameUrl,
      buttonIndex,
      opaqueConversationIdentifier,
      timestamp,
      inputText: inputText || "",
      unixTimestamp: now,
      state: state || "",
      address: address || "",
      transactionId: transactionId || "",
    };

    const signedAction = await this.buildSignedFrameAction(toSign);

    return {
      clientProtocol: `xmtp@${PROTOCOL_VERSION}`,
      untrustedData: {
        buttonIndex,
        opaqueConversationIdentifier,
        walletAddress: await this.#signer.address(),
        inputText,
        url: frameUrl,
        timestamp: now,
        unixTimestamp: now,
        state,
        // The address associated with initiating a transaction
        address,
        transactionId,
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
    let payload: frames.FrameAction;

    if (isV3FramesSigner(this.#signer)) {
      const signature = await this.#signer.sign(digest);
      payload = {
        actionBody,
        inboxId: await this.#signer.inboxId(),
        installationId: await this.#signer.installationId(),
        installationSignature: signature,
        signature: undefined,
        signedPublicKeyBundle: undefined,
      };
    } else {
      const signature = await this.#signer.sign(digest);
      const publicKeyBundle = await this.#signer.getPublicKeyBundle();
      payload = {
        actionBody,
        inboxId: "",
        installationId: new Uint8Array(),
        installationSignature: new Uint8Array(),
        signature,
        signedPublicKeyBundle: v1ToV2Bundle(publicKeyBundle),
      };
    }

    return frames.FrameAction.encode(payload).finish();
  }
}
