import assert from 'assert'
import { ContentTypeId, ContentCodec, TextCodec, ContentTypeText } from '../src'
import {
  Composite,
  CompositeCodec,
  ContentTypeComposite,
} from '../src/CompositeContent'

// A helper to replace a full Client in testing custom content types,
// extracting just the codec registry aspect of the client.
export class CodecRegistry {
  private _codecs: Map<string, ContentCodec<any>>

  constructor() {
    this._codecs = new Map()
    this.registerCodec(new TextCodec())
  }

  registerCodec(codec: ContentCodec<any>): void {
    const id = codec.contentType
    const key = `${id.authorityId}/${id.typeId}`
    this._codecs.set(key, codec)
  }

  codecFor(contentType: ContentTypeId): ContentCodec<any> | undefined {
    const key = `${contentType.authorityId}/${contentType.typeId}`
    return this._codecs.get(key)
  }
}

describe('CompositeType', () => {
  it('simple composite', async () => {
    const codecs = new CodecRegistry()
    const codec = new CompositeCodec()
    const content = new Composite([
      { type: ContentTypeText, content: 'hello' },
      { type: ContentTypeText, content: 'bye' },
    ])
    const encoded = codec.encode(content, codecs)
    assert(encoded.type.sameAs(ContentTypeComposite))
    const decoded = codec.decode(encoded, codecs)
    assert.deepEqual(decoded, content)
  })
  it('nested composite', async () => {
    const codecs = new CodecRegistry()
    const codec = new CompositeCodec()
    codecs.registerCodec(codec)
    const content = new Composite([
      { type: ContentTypeText, content: 'one' },
      {
        type: ContentTypeComposite,
        content: new Composite([
          { type: ContentTypeText, content: 'two' },
          {
            type: ContentTypeComposite,
            content: new Composite([
              { type: ContentTypeText, content: 'three' },
            ]),
          },
        ]),
      },
      {
        type: ContentTypeComposite,
        content: new Composite([
          { type: ContentTypeText, content: 'four' },
          {
            type: ContentTypeComposite,
            content: new Composite([
              { type: ContentTypeText, content: 'five' },
            ]),
          },
        ]),
      },
    ])
    const encoded = codec.encode(content, codecs)
    assert(encoded.type.sameAs(ContentTypeComposite))
    const decoded = codec.decode(encoded, codecs)
    assert.deepEqual(decoded, content)
  })
})
