import type { ContentCodec, EncodedContent } from "@xmtp/xmtp-js";
import { ContentTypeId } from "@xmtp/xmtp-js";

export const ContentTypeAttachment = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "attachment",
  versionMajor: 1,
  versionMinor: 0,
});

export type Attachment = {
  filename: string;
  mimeType: string;
  data: Uint8Array;
};

export class AttachmentCodec implements ContentCodec<Attachment> {
  get contentType(): ContentTypeId {
    return ContentTypeAttachment;
  }

  encode(content: Attachment): EncodedContent {
    return {
      type: ContentTypeAttachment,
      parameters: {
        filename: content.filename,
        mimeType: content.mimeType,
      },
      content: content.data,
    };
  }

  decode(content: EncodedContent): Attachment {
    return {
      filename: content.parameters.filename,
      mimeType: content.parameters.mimeType,
      data: content.content,
    };
  }

  fallback(content: Attachment): string | undefined {
    return `Can’t display "${content.filename}". This app doesn’t support attachments.`;
  }
}
