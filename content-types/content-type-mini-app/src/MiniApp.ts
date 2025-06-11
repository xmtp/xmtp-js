import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { hexToUint8Array, uint8ArrayToHex } from "uint8array-extras";
import type { ValidData } from "./data";
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
    const finalContent = content;
    if (finalContent.type === "response") {
      finalContent.data = uint8ArrayToHex(
        new TextEncoder().encode(JSON.stringify(finalContent.data)),
      );
    }
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(finalContent)),
      // compress content using gzip
      compression: 1,
    };
  }

  decode(encodedContent: EncodedContent): MiniAppContent {
    const decodedContent = new TextDecoder().decode(encodedContent.content);

    try {
      const parsedContent = JSON.parse(decodedContent) as MiniAppContent;
      if (parsedContent.type === "response") {
        const data = hexToUint8Array(parsedContent.data as string);
        const decodedData = new TextDecoder().decode(data);
        parsedContent.data = JSON.parse(decodedData) as ValidData;
      }
      return parsedContent;
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
