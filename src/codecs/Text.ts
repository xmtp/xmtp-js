import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from '@/MessageContent'

// xmtp.org/text
//
// This content type is used for a plain text content represented by a simple string
export const ContentTypeText = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'text',
  versionMajor: 1,
  versionMinor: 0,
})

export enum Encoding {
  utf8 = 'UTF-8',
}

export class TextCodec implements ContentCodec<string> {
  get contentType(): ContentTypeId {
    return ContentTypeText
  }

  encode(content: string): EncodedContent {
    return {
      type: ContentTypeText,
      parameters: { encoding: Encoding.utf8 },
      content: new TextEncoder().encode(content),
    }
  }

  decode(content: EncodedContent): string {
    const encoding = content.parameters.encoding
    if (encoding && encoding !== Encoding.utf8) {
      throw new Error(`unrecognized encoding ${encoding}`)
    }
    return new TextDecoder().decode(content.content)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fallback(content: string): string | undefined {
    return undefined
  }

  shouldPush() {
    return true
  }
}
