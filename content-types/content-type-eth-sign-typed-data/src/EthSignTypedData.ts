import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import type { Account, SignTypedDataParameters } from "viem";

export const ContentTypeEthSignTypedData = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "eth_signTypedData",
  versionMajor: 1,
  versionMinor: 0,
});

export type EthSignTypedDataParams = Omit<SignTypedDataParameters, 'account'> & {
  account?: Account,
  metadata: {
    description: string;
    transactionType: string;
  } & Record<string, string>;
};

export class EthSignTypedDataCodec
  implements ContentCodec<EthSignTypedDataParams>
{
  get contentType(): ContentTypeId {
    return ContentTypeEthSignTypedData;
  }

  encode(content: EthSignTypedDataParams): EncodedContent {
    const encoded = {
      type: ContentTypeEthSignTypedData,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
    return encoded;
  }

  decode(encodedContent: EncodedContent): EthSignTypedDataParams {
    const uint8Array = encodedContent.content;
    const contentReceived = JSON.parse(
      new TextDecoder().decode(uint8Array),
    ) as EthSignTypedDataParams;
    return contentReceived;
  }

  fallback(content: EthSignTypedDataParams): string | undefined {
    return `[Transaction request generated]: ${JSON.stringify(content)}`;
  }

  shouldPush() {
    return true;
  }
}
