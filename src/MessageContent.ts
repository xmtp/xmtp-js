export type ContentTypeId = {
  authorityId: string
  typeId: string
  versionMajor: number
  versionMinor: number
}

export interface EncodedContent {
  contentType: ContentTypeId
  contentTypeParams: Record<string, string>
  contentDescription?: string
  content: Uint8Array
}

export interface ContentEncoder<T> {
  contentType: ContentTypeId
  encode(message: T): EncodedContent
  decode(content: EncodedContent): T
}

export type MessageContent =
  | string
  | {
      readonly contentType: ContentTypeId
      readonly content: any
    }

export const ContentTypeText = {
  authorityId: 'xmtp.org',
  typeId: 'text',
  versionMajor: 1,
  versionMinor: 0,
}

export class TextContentEncoder implements ContentEncoder<string> {
  get contentType(): ContentTypeId {
    return ContentTypeText
  }

  encode(content: string): EncodedContent {
    return {
      contentType: ContentTypeText,
      contentTypeParams: {},
      content: new TextEncoder().encode(content),
    }
  }

  decode(content: EncodedContent): string {
    return new TextDecoder().decode(content.content)
  }
}

// This content type is used to provide the recipient
// the alternative content description (if present)
// in case the content type is not supported.
export const ContentTypeAlternativeDescription = {
  authorityId: 'xmtp.org',
  typeId: 'alternative-description',
  versionMajor: 1,
  versionMinor: 0,
}

export class AlternativeContentDescription {
  content: string
  constructor(description: string) {
    this.content = description
  }

  get contentType(): ContentTypeId {
    return ContentTypeAlternativeDescription
  }
}
