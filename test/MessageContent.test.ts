import assert from 'assert'
import * as proto from '../src/proto/messaging'
import {
  compress,
  decompress,
  readStreamFromBytes,
  writeStreamToBytes,
} from '../src/MessageContent'
import { ContentTypeText } from '../src/codecs/Text'

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
