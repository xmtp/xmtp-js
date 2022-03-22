import * as proto from './proto/messaging'

if (
  typeof window !== 'object' ||
  typeof navigator !== 'object' ||
  navigator.userAgent.includes('jsdom')
) {
  require('@stardazed/streams-polyfill')
}

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

function compressionIdFromCode(code: proto.Compression): string {
  if (code === proto.Compression.gzip) {
    return 'gzip'
  }
  if (code === proto.Compression.deflate) {
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
