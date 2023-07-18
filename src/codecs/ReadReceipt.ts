import { ContentTypeId, ContentCodec, EncodedContent } from '../MessageContent'

// This content type is used for read receipts
export const ContentTypeReadReceipt = new ContentTypeId({
  authorityId: 'xmtp.com',
  typeId: 'readReceipt',
  versionMajor: 1,
  versionMinor: 0,
})

export type ReadReceipt = {
  timestamp: Date
}

export class ReadReceiptCodec implements ContentCodec<ReadReceipt> {
  get contentType(): ContentTypeId {
    return ContentTypeReadReceipt
  }

  encode(content: ReadReceipt): EncodedContent {
    return {
      type: ContentTypeReadReceipt,
      parameters: {
        timestamp: content.timestamp.toISOString(),
      },
      content: new Uint8Array(),
    }
  }

  decode(content: EncodedContent): ReadReceipt {
    const timestamp = new Date(content.parameters.timestamp)

    return {
      timestamp,
    }
  }
}
