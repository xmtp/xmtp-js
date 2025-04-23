import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import type { MiniAppContent } from "./types/content";

export const ContentTypeMiniApp = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "mini-app",
  versionMajor: 1,
  versionMinor: 0,
});

export class MiniAppCodec implements ContentCodec<MiniAppContent> {
  get contentType(): ContentTypeId {
    return ContentTypeMiniApp;
  }

  encode(content: MiniAppContent): EncodedContent {
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
      // compress content using gzip
      compression: 1,
    };
  }

  decode(encodedContent: EncodedContent): MiniAppContent {
    const decodedContent = new TextDecoder().decode(encodedContent.content);

    try {
      return JSON.parse(decodedContent) as MiniAppContent;
    } catch {
      throw new Error("[MiniAppCodec] Failed to decode content");
    }
  }

  fallback() {
    return undefined;
  }

  shouldPush() {
    return false;
  }
}
