import assert from 'assert'
import * as proto from '../src/proto/messaging'
import {
  compress,
  decompress,
  readStreamFromBytes,
  writeStreamToBytes,
  ContentTypeText,
} from '../src/MessageContent'

describe('MessageContent', function () {
  it('can stream bytes from source to sink', async function () {
    let from = new Uint8Array(111).fill(42)
    // make sink smaller so that it has to grow a lot
    let to = { bytes: new Uint8Array(3) }
    await readStreamFromBytes(from, 23).pipeTo(writeStreamToBytes(to))
    assert.deepEqual(from, to.bytes)
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
    await decompress(content)
    assert.deepEqual(content.content, uncompressed)
  })
})
