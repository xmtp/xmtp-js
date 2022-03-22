import {
  ContentTypeId,
  ContentCodec,
  EncodedContent,
  CodecRegistry,
} from './MessageContent'
import * as proto from './proto/composite'

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

type CompositePart = {
  type: ContentTypeId
  content: any
}

export class Composite {
  parts: CompositePart[]

  constructor(parts: Array<CompositePart>) {
    this.parts = parts
  }

  add(type: ContentTypeId, part: any): void {
    this.parts.push({ type: type, content: part })
  }
}

export class CompositeCodec implements ContentCodec<Composite> {
  get contentType(): ContentTypeId {
    return ContentTypeComposite
  }

  encode(content: Composite, codecs: CodecRegistry): EncodedContent {
    const parts = new Array<EncodedContent>()
    for (const part of content.parts) {
      const codec = codecs.codecFor(part.type)
      if (!codec) {
        throw new Error(`missing codec for part type ${part.type}`)
      }
      parts.push(codec.encode(part.content, codecs))
    }
    const bytes = proto.Composite.encode({ parts: parts }).finish()
    return {
      type: ContentTypeComposite,
      parameters: {},
      content: bytes,
    }
  }

  decode(content: EncodedContent, codecs: CodecRegistry): Composite {
    const parts = new Array<CompositePart>()
    for (const part of proto.Composite.decode(content.content).parts) {
      if (!part.type) {
        throw new Error('missing part content type')
      }
      const contentType = new ContentTypeId(part.type)
      const codec = codecs.codecFor(contentType)
      if (!codec) {
        throw new Error(`missing codec for part type ${contentType}`)
      }
      parts.push({
        type: contentType,
        content: codec.decode(part as EncodedContent, codecs),
      })
    }
    return new Composite(parts)
  }
}
