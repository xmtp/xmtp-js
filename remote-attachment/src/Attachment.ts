import { ContentCodec, ContentTypeId, EncodedContent } from "@xmtp/xmtp-js"
import { CodecRegistry } from "@xmtp/xmtp-js/dist/types/src/MessageContent"

export const ContentTypeAttachment = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'attachment',
  versionMajor: 1,
  versionMinor: 0
})

export type Attachment = {
  filename: string,
  mimeType: string,
  data: Uint8Array
}

export class AttachmentCodec implements ContentCodec<Attachment> {
  get contentType(): ContentTypeId {
    return ContentTypeAttachment
  }

  encode(content: Attachment, registry: CodecRegistry): EncodedContent {
    return {
      type: ContentTypeAttachment,
      parameters: {
        filename: content.filename,
        mimeType: content.mimeType
      },
      content: content.data
    }
  }

  decode(content: EncodedContent, registry: CodecRegistry): Attachment {
    return {
      filename: content.parameters.filename,
      mimeType: content.parameters.mimeType,
      data: content.content
    }
  }
}
