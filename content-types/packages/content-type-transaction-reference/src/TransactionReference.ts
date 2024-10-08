import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

export const ContentTypeTransactionReference = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "transactionReference",
  versionMajor: 1,
  versionMinor: 0,
});

export type TransactionReference = {
  /**
   * The namespace for the networkId
   */
  namespace?: string;
  /**
   * The networkId for the transaction, in decimal or hexidecimal format
   */
  networkId: number | string;
  /**
   * The transaction hash
   */
  reference: string;
  /**
   * Optional metadata object
   */
  metadata?: {
    transactionType: string;
    currency: string;
    amount: number;
    decimals: number;
    fromAddress: string;
    toAddress: string;
  };
};

export class TransactionReferenceCodec
  implements ContentCodec<TransactionReference>
{
  get contentType(): ContentTypeId {
    return ContentTypeTransactionReference;
  }

  encode(content: TransactionReference): EncodedContent {
    const encoded = {
      type: ContentTypeTransactionReference,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
    return encoded;
  }

  decode(encodedContent: EncodedContent): TransactionReference {
    const uint8Array = encodedContent.content;
    const contentReceived = JSON.parse(
      new TextDecoder().decode(uint8Array),
    ) as TransactionReference;
    return contentReceived;
  }

  fallback(content: TransactionReference): string | undefined {
    if (content.reference) {
      return `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: ${content.reference}`;
    }
    return `Crypto transaction`;
  }

  shouldPush() {
    return true;
  }
}
