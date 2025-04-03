/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

export const ContentTypeWalletSendCalls = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "walletSendCalls",
  versionMajor: 1,
  versionMinor: 0,
});

export type WalletSendCallsParams = {
  version: string;
  chainId: `0x${string}`; // Hex chain id
  from: `0x${string}`;
  calls: {
    to?: `0x${string}` | undefined;
    data?: `0x${string}` | undefined;
    value?: `0x${string}` | undefined; // Hex value
    gas?: `0x${string}` | undefined;
    metadata?: {
      description: string;
      transactionType: string;
    } & Record<string, any>;
  }[];
  capabilities?: Record<string, any> | undefined;
};

export class WalletSendCallsCodec
  implements ContentCodec<WalletSendCallsParams>
{
  get contentType(): ContentTypeId {
    return ContentTypeWalletSendCalls;
  }

  encode(content: WalletSendCallsParams): EncodedContent {
    const encoded = {
      type: ContentTypeWalletSendCalls,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
    return encoded;
  }

  decode(encodedContent: EncodedContent): WalletSendCallsParams {
    const uint8Array = encodedContent.content;
    const contentReceived = JSON.parse(
      new TextDecoder().decode(uint8Array),
    ) as WalletSendCallsParams;
    return contentReceived;
  }

  fallback(content: WalletSendCallsParams): string | undefined {
    return `[Transaction request generated]: ${JSON.stringify(content)}`;
  }

  shouldPush() {
    return true;
  }
}
