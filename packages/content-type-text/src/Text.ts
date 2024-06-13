import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";

export const ContentTypeText = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "text",
  versionMajor: 1,
  versionMinor: 0,
});

export enum Encoding {
  utf8 = "UTF-8",
}

export class TextCodec implements ContentCodec<string> {
  get contentType(): ContentTypeId {
    return ContentTypeText;
  }

  encode(content: string): EncodedContent {
    return {
      type: ContentTypeText,
      parameters: { encoding: Encoding.utf8 },
      content: new TextEncoder().encode(content),
    };
  }

  decode(content: EncodedContent) {
    const { encoding } = content.parameters;
    if ((encoding as Encoding) !== Encoding.utf8) {
      throw new Error(`unrecognized encoding ${encoding}`);
    }
    return new TextDecoder().decode(content.content);
  }

  fallback() {
    return undefined;
  }

  shouldPush() {
    return true;
  }
}
