import { composite as proto } from '@xmtp/proto'
import {
  ContentTypeId,
  type CodecRegistry,
  type ContentCodec,
  type EncodedContent,
} from '@/MessageContent'

// xmtp.org/composite
//
// Composite is a generic sequence of multiple parts of arbitrary content type.
// It can be nested arbitrarily (composite of composites).

export const ContentTypeComposite = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'composite',
  versionMajor: 1,
  versionMinor: 0,
})

// Composite type defines the expected structure of values
// that can be processed by the CompositeCodec
export type Composite =
  | {
      type: ContentTypeId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: any
    }
  | { parts: Composite[] }

// CompositeCodec implements encoding/decoding of Composite values.
// Register this codec with the Client if you want support for Composite content.
export class CompositeCodec implements ContentCodec<Composite> {
  get contentType(): ContentTypeId {
    return ContentTypeComposite
  }

  encode(content: Composite, codecs: CodecRegistry): EncodedContent {
    const part = this.toProto(content, codecs)
    let composite: proto.Composite
    if (part.composite) {
      composite = part.composite
    } else {
      composite = { parts: [part] }
    }
    const bytes = proto.Composite.encode(composite).finish()
    return {
      type: ContentTypeComposite,
      parameters: {},
      content: bytes,
    }
  }

  decode(content: EncodedContent, codecs: CodecRegistry): Composite {
    return this.fromProto(
      { composite: proto.Composite.decode(content.content), part: undefined },
      codecs
    )
  }

  private toProto(
    content: Composite,
    codecs: CodecRegistry
  ): proto.Composite_Part {
    if ('type' in content) {
      const codec = codecs.codecFor(content.type)
      if (!codec) {
        throw new Error(`missing codec for part type ${content.type}`)
      }
      return {
        part: codec.encode(content.content, codecs),
        composite: undefined,
      }
    }
    const parts = new Array<proto.Composite_Part>()
    for (const part of content.parts) {
      parts.push(this.toProto(part, codecs))
    }
    return { composite: { parts }, part: undefined }
  }

  private fromProto(
    content: proto.Composite_Part,
    codecs: CodecRegistry
  ): Composite {
    if (content.part) {
      if (!content.part.type) {
        throw new Error('missing part content type')
      }
      const contentType = new ContentTypeId(content.part.type)
      const codec = codecs.codecFor(contentType)
      if (!codec) {
        throw new Error(`missing codec for part type ${contentType}`)
      }
      return {
        type: contentType,
        content: codec.decode(content.part as EncodedContent, codecs),
      }
    }
    if (!content.composite) {
      throw new Error('invalid composite')
    }
    const parts = new Array<Composite>()
    for (const part of content.composite.parts) {
      parts.push(this.fromProto(part, codecs))
    }
    return { parts }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fallback(content: Composite): string | undefined {
    return undefined
  }

  shouldPush() {
    return false
  }
}
