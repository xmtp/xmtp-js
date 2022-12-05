import { content as proto } from '@xmtp/proto'

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

  toString(): string {
    return `${this.authorityId}/${this.typeId}:${this.versionMajor}.${this.versionMinor}`
  }

  sameAs(id: ContentTypeId): boolean {
    return this.authorityId === id.authorityId && this.typeId === id.typeId
  }
}

// Represents proto.EncodedContent
export interface EncodedContent {
  type: ContentTypeId
  parameters: Record<string, string>
  fallback?: string
  compression?: number
  content: Uint8Array
}

// Define an interface for the encoding machinery for a specific content type
// associated with a given ContentTypeId
// A codec can be registered with a Client to be automatically invoked when
// handling content of the corresponding content type.
export interface CodecRegistry {
  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-explicit-any
  codecFor(contentType: ContentTypeId): ContentCodec<any> | undefined
}

export interface ContentCodec<T> {
  contentType: ContentTypeId
  encode(content: T, registry: CodecRegistry): EncodedContent
  decode(content: EncodedContent, registry: CodecRegistry): T
}

// xmtp.org/fallback
//
// This is not a real content type, it is used to signal to the recipient
// that the content in the message is the fallback description (if present)
// in case the original content type is not supported.
// This content type MUST NOT be used to send content.
export const ContentTypeFallback = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'fallback',
  versionMajor: 1,
  versionMinor: 0,
})
