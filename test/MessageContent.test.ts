import assert from 'assert'
import * as proto from '../src/proto/messaging'
import {
  compress,
  decompress,
  readStreamFromBytes,
  writeStreamToBytes,
  ContentTypeText,
  Encoding,
} from '../src/MessageContent'
import { CodecRegistry } from './helpers'

describe('MessageContent', function () {
  it('can stream bytes from source to sink', async function () {
    let from = new Uint8Array(111).fill(42)
    // make sink smaller so that it has to grow a lot
    let to = { bytes: new Uint8Array(3) }
    await readStreamFromBytes(from, 23).pipeTo(writeStreamToBytes(to, 1000))
    assert.deepEqual(from, to.bytes)
  })

  it('will not write beyond limit', async () => {
    let from = new Uint8Array(111).fill(42)
    let to = { bytes: new Uint8Array(10) }
    await expect(
      readStreamFromBytes(from, 23).pipeTo(writeStreamToBytes(to, 100))
    ).rejects.toThrow('maximum output size exceeded')
  })

  it('compresses and decompresses', async function () {
    const uncompressed = new Uint8Array(55).fill(42)
    const compressed = new Uint8Array([
      120, 1, 211, 210, 34, 11, 0, 0, 252, 223, 9, 7,
    ])
    let content = {
      type: ContentTypeText,
      parameters: {},
      content: uncompressed,
      compression: proto.Compression.deflate,
    }
    await compress(content)
    assert.deepEqual(content.content, compressed)
    await decompress(content, 1000)
    assert.deepEqual(content.content, uncompressed)
  })
})

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
    expect(codec.encode(7, codecs)).rejects
  })

  it('throws on invalid utf8', () => {
    const ec = {
      type: ContentTypeText,
      parameters: {},
      content: new Uint8Array([0xe2, 0x28, 0x81]),
    }
    expect(() => codec.decode(ec, codecs)).rejects
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
