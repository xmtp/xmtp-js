import { ContentTypeId, ContentCodec, EncodedContent } from '../MessageContent'

// xmtp.org/typingNotification
//
// This content type is used for typing notifications
export const ContentTypeTypingNotification = new ContentTypeId({
  authorityId: 'xmtp.com',
  typeId: 'typingNotification',
  versionMajor: 1,
  versionMinor: 0,
})

export type TypingNotification = {
  timestamp: Date
  typerAddress: string
  isFinished: boolean
}

// Important: Typing Notifications should only be sent on ephemeral topics.
export class TypingNotificationCodec
  implements ContentCodec<TypingNotification>
{
  get contentType(): ContentTypeId {
    return ContentTypeTypingNotification
  }

  encode(content: TypingNotification): EncodedContent {
    return {
      type: ContentTypeTypingNotification,
      parameters: {
        timestamp: content.timestamp.toISOString(),
        typerAddress: content.typerAddress,
        isFinished: content.isFinished ? 'true' : 'false',
      },
      content: new Uint8Array(),
    }
  }

  decode(content: EncodedContent): TypingNotification {
    const timestamp = new Date(content.parameters.timestamp)
    const typerAddress = content.parameters.senderAddress
    const isFinished = content.parameters.isFinished === 'true'

    return {
      timestamp,
      typerAddress,
      isFinished,
    }
  }
}
