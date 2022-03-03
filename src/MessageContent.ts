import * as proto from './proto/messaging'

// Represents proto.ContentTypeId
export class ContentTypeId {
  authorityId: string
  typeId: string
  versionMajor: number
  versionMinor: number

  constructor(obj: proto.ContentTypeId) {
    this.authorityId = obj.authorityId
    this.typeId = obj.typeId
    this.versionMajor = obj.versionMajor
    this.versionMinor = obj.versionMinor
  }

  sameAs(id: ContentTypeId): boolean {
    return this.authorityId == id.authorityId && this.typeId == id.typeId
  }
}

// Represents proto.EncodedContent
export interface EncodedContent {
  contentType: ContentTypeId
  contentTypeParams: Record<string, string>
  contentDescription?: string
  content: Uint8Array
}

// Defines an interface for the encoding machinery for a specific content type
// associated with a given ContentTypeId
// An encoder can be registered with a Client to be automatically invoked when
// handling content of the corresponding content type.
export interface ContentEncoder<T> {
  contentType: ContentTypeId
  encode(message: T): EncodedContent
  decode(content: EncodedContent): T
}

// MessageContent represents types that the Client is able to map to a content type.
// The Client API expects the provided content to conform to this type definition.
export type MessageContent =
  | string
  | {
      readonly contentType: ContentTypeId
      readonly content: any
    }

// xmtp.org/text
//
// This content type is used for a plain text content represented by a simple string
export const ContentTypeText = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'text',
  versionMajor: 1,
  versionMinor: 0,
})

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

// xmtp.org/alternative-description
//
// This content type is used to provide the recipient
// the alternative content description (if present)
// in case the content type is not supported.
export const ContentTypeAlternativeDescription = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'alternative-description',
  versionMajor: 1,
  versionMinor: 0,
})

export class AlternativeContentDescription {
  content: string
  constructor(description: string) {
    this.content = description
  }

  get contentType(): ContentTypeId {
    return ContentTypeAlternativeDescription
  }
}
