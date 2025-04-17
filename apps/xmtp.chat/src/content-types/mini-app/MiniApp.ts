import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import type { MiniAppAction } from "./types/actions";

export const ContentTypeMiniApp = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "mini-app",
  versionMajor: 1,
  versionMinor: 0,
});

export type MiniApp = {
  author: string;
  version: string;
  name: string;
  description?: string;
  icon?: string;
  url?: string;
  appStoreUrl?: string;
  senderInboxId: string;
  action: MiniAppAction;
};

export class MiniAppCodec implements ContentCodec<MiniApp> {
  get contentType(): ContentTypeId {
    return ContentTypeMiniApp;
  }

  encode(content: MiniApp) {
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(encodedContent: EncodedContent): MiniApp {
    const decodedContent = new TextDecoder().decode(encodedContent.content);

    try {
      return JSON.parse(decodedContent) as MiniApp;
    } catch {
      throw new Error("failed to decode mini app message");
    }
  }

  fallback(): string | undefined {
    return undefined;
  }

  shouldPush() {
    return true;
  }
}
