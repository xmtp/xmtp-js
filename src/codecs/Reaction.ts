import { ContentTypeId, ContentCodec, EncodedContent } from '../MessageContent'

// xmtp.org/text
//
// This content type is used for a plain text content represented by a simple string
export const ContentTypeReaction = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'reaction',
  versionMajor: 1,
  versionMinor: 0,
})

export type Reaction = {
  /**
   * The message ID for the message that is being reacted to
   */
  reference: string
  /**
   * The action of the reaction
   */
  action: 'added' | 'removed'
  /**
   * The content of the reaction
   */
  content: string
}

export type ReactionParameters = Pick<Reaction, 'action' | 'reference'> & {
  encoding: 'UTF-8'
}

export class ReactionCodec implements ContentCodec<Reaction> {
  get contentType(): ContentTypeId {
    return ContentTypeReaction
  }

  encode(content: Reaction): EncodedContent<ReactionParameters> {
    return {
      type: ContentTypeReaction,
      parameters: {
        encoding: 'UTF-8',
        action: content.action,
        reference: content.reference,
      },
      content: new TextEncoder().encode(content.content),
    }
  }

  decode(content: EncodedContent<ReactionParameters>): Reaction {
    const encoding = content.parameters.encoding
    if (encoding && encoding !== 'UTF-8') {
      throw new Error(`unrecognized encoding ${encoding}`)
    }
    return {
      action: content.parameters.action,
      reference: content.parameters.reference,
      content: new TextDecoder().decode(content.content),
    }
  }
}
