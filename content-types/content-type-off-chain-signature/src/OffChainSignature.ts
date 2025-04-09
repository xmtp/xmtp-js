import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

export const ContentTypeOffChainSignature = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "offChainSignature",
  versionMajor: 1,
  versionMinor: 0,
});

export type OffChainSignature = {
  /**
   * The namespace for the networkId
   */
  namespace?: string;
  /**
   * The networkId for the signature, in decimal or hexidecimal format
   */
  networkId: number | string;
  /**
   * The offline signature
   */
  signature: string;
  /**
   * Optional metadata object
   */
  metadata?: {
    transactionType: string;
    fromAddress?: string;
  };
};

export class OffChainSignatureCodec implements ContentCodec<OffChainSignature> {
  get contentType(): ContentTypeId {
    return ContentTypeOffChainSignature;
  }

  encode(content: OffChainSignature): EncodedContent {
    const encoded = {
      type: ContentTypeOffChainSignature,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
    return encoded;
  }

  decode(encodedContent: EncodedContent): OffChainSignature {
    const uint8Array = encodedContent.content;
    const contentReceived = JSON.parse(
      new TextDecoder().decode(uint8Array),
    ) as OffChainSignature;
    return contentReceived;
  }

  fallback(content: OffChainSignature): string | undefined {
    return `[Off-Chain Signature]: ${content.signature}`;
  }

  shouldPush() {
    return true;
  }
}
