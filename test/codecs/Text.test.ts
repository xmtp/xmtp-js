import assert from 'assert'
import { CodecRegistry } from '../helpers'
import { ContentTypeText, Encoding } from '../../src/codecs/Text'

describe('ContentTypeText', () => {
  const codecs = new CodecRegistry()
  const codec = codecs.codecFor(ContentTypeText)
  assert(codec)

  it('can encode/decode text', () => {
    const text = 'Hey'
    const ec = codec.encode(text, codecs)
    assert(ec.type.sameAs(ContentTypeText))
    assert.equal(ec.parameters.encoding, Encoding.utf8)
    const text2 = codec.decode(ec, codecs)
    assert.equal(text2, text)
  })

  it('defaults to utf-8', () => {
    const text = 'Hey'
    const ec = codec.encode(text, codecs)
    assert(ec.type.sameAs(ContentTypeText))
    assert.equal(ec.parameters.encoding, Encoding.utf8)
    delete ec.parameters.encoding
    const text2 = codec.decode(ec, codecs)
    assert.equal(text2, text)
  })

  it('throws on non-string', () => {
    expect(() =>
      new TextEncoder().encode({
        toString() {
          throw new Error('GM!')
        },
      } as any)
    ).toThrow('GM!')
  })

  it('throws on invalid input', () => {
    const ec = {
      type: ContentTypeText,
      parameters: {},
      content: {} as Uint8Array,
    }
    expect(() => codec.decode(ec, codecs)).toThrow()
  })

  it('throws on unknown encoding', () => {
    const ec = {
      type: ContentTypeText,
      parameters: { encoding: 'UTF-16' },
      content: new Uint8Array(0),
    }
    expect(() => codec.decode(ec, codecs)).toThrow(
      'unrecognized encoding UTF-16'
    )
  })
})
