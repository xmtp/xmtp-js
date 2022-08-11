import assert from 'assert'
import { ContentTypeText } from '../../src'
import {
  CompositeCodec,
  ContentTypeComposite,
} from '../../src/codecs/Composite'
import { CodecRegistry } from '../helpers'

describe('CompositeType', () => {
  const codecs = new CodecRegistry()
  const codec = new CompositeCodec()
  codecs.registerCodec(codec)
  it('simple composite', async () => {
    const content = {
      parts: [
        { type: ContentTypeText, content: 'hello' },
        { type: ContentTypeText, content: 'bye' },
      ],
    }
    const encoded = codec.encode(content, codecs)
    assert(encoded.type.sameAs(ContentTypeComposite))
    const decoded = codec.decode(encoded, codecs)
    assert.deepEqual(decoded, content)
  })
  it('nested composite', async () => {
    const content = {
      parts: [
        { type: ContentTypeText, content: 'one' },
        {
          parts: [
            { type: ContentTypeText, content: 'two' },
            {
              parts: [{ type: ContentTypeText, content: 'three' }],
            },
          ],
        },
        {
          parts: [
            { type: ContentTypeText, content: 'four' },
            {
              parts: [{ type: ContentTypeText, content: 'five' }],
            },
          ],
        },
      ],
    }
    const encoded = codec.encode(content, codecs)
    assert(encoded.type.sameAs(ContentTypeComposite))
    const decoded = codec.decode(encoded, codecs)
    assert.deepEqual(decoded, content)
  })

  it('not quite composite decodes as single part composite', async () => {
    const content = { type: ContentTypeText, content: 'one' }
    const encoded = codec.encode(content, codecs)
    assert(encoded.type.sameAs(ContentTypeComposite))
    const decoded = codec.decode(encoded, codecs)
    assert.deepEqual(decoded, { parts: [content] })
  })

  it('definitely not a composite', () => {
    const codec = codecs.codecFor(ContentTypeComposite)
    assert(codec)
    expect(() => codec.encode('definitely not a composite', codecs)).rejects
  })
})
