// This import has to come first so that the polyfills are registered before the stream polyfills
import { content as proto } from '@xmtp/proto'

//
// Compression
//
export async function decompress(
  encoded: proto.EncodedContent,
  maxSize: number
): Promise<void> {
  if (encoded.compression === undefined) {
    return
  }
  const sink = { bytes: new Uint8Array(encoded.content.length) }
  await readStreamFromBytes(encoded.content)
    .pipeThrough(
      new DecompressionStream(compressionIdFromCode(encoded.compression))
    )
    .pipeTo(writeStreamToBytes(sink, maxSize))
  encoded.content = sink.bytes
}

export async function compress(encoded: proto.EncodedContent): Promise<void> {
  if (encoded.compression === undefined) {
    return
  }
  const sink = { bytes: new Uint8Array(encoded.content.length / 10) }
  await readStreamFromBytes(encoded.content)
    .pipeThrough(
      new CompressionStream(compressionIdFromCode(encoded.compression))
    )
    .pipeTo(writeStreamToBytes(sink, encoded.content.length + 1000))
  encoded.content = sink.bytes
}

function compressionIdFromCode(code: proto.Compression) {
  if (code === proto.Compression.COMPRESSION_GZIP) {
    return 'gzip'
  }
  if (code === proto.Compression.COMPRESSION_DEFLATE) {
    return 'deflate'
  }
  throw new Error('unrecognized compression algorithm')
}

export function readStreamFromBytes(
  bytes: Uint8Array,
  chunkSize = 1024
): ReadableStream {
  let position = 0
  return new ReadableStream({
    pull(controller) {
      if (position >= bytes.length) {
        return controller.close()
      }
      let end = position + chunkSize
      end = end <= bytes.length ? end : bytes.length
      controller.enqueue(bytes.subarray(position, end))
      position = end
    },
  })
}

export function writeStreamToBytes(
  sink: {
    bytes: Uint8Array
  },
  maxSize: number
): WritableStream {
  let position = 0
  return new WritableStream({
    write(chunk: Uint8Array) {
      const end = position + chunk.length
      if (end > maxSize) {
        throw new Error('maximum output size exceeded')
      }
      while (sink.bytes.length < end) {
        sink.bytes = growBytes(sink.bytes, maxSize)
      }
      sink.bytes.set(chunk, position)
      position = end
    },

    close() {
      if (position < sink.bytes.length) {
        sink.bytes = sink.bytes.subarray(0, position)
      }
    },
  })
}
function growBytes(bytes: Uint8Array, maxSize: number): Uint8Array {
  let newSize = bytes.length * 2
  if (newSize > maxSize) {
    newSize = maxSize
  }
  const bigger = new Uint8Array(newSize)
  bigger.set(bytes)
  return bigger
}
