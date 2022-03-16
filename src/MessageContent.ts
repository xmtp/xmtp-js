import * as proto from './proto/messaging'

if (typeof window === 'undefined') {
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

// Defines an interface for the encoding machinery for a specific content type
// associated with a given ContentTypeId
// A codec can be registered with a Client to be automatically invoked when
// handling content of the corresponding content type.
export interface ContentCodec<T> {
  contentType: ContentTypeId
  encode(message: T): EncodedContent
  decode(content: EncodedContent): T
}

// MessageContent represents types that the Client is able to map to a content type.
// The Client API expects the provided content to conform to this type definition.
// export type MessageContent =
//   | string
//   | {
//       readonly contentType: ContentTypeId
//       readonly content: any
//     }

// xmtp.org/text
//
// This content type is used for a plain text content represented by a simple string
export const ContentTypeText = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'text',
  versionMajor: 1,
  versionMinor: 0,
})

export class TextCodec implements ContentCodec<string> {
  get contentType(): ContentTypeId {
    return ContentTypeText
  }

  encode(content: string): EncodedContent {
    return {
      type: ContentTypeText,
      parameters: {},
      content: new TextEncoder().encode(content),
    }
  }

  decode(content: EncodedContent): string {
    return new TextDecoder().decode(content.content)
  }
}

// xmtp.org/alternative-description
//
// This content type is used to indicate to the recipient
// that the content in the message is the fallback description (if present)
// in case the content type is not supported.
export const ContentTypeFallback = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'fallback',
  versionMajor: 1,
  versionMinor: 0,
})

//
// Compression
//

export async function decompress(encoded: proto.EncodedContent): Promise<void> {
  if (encoded.compression === undefined) {
    return
  }
  const sink = { bytes: new Uint8Array(encoded.content.length) }
  await readStreamFromBytes(encoded.content)
    .pipeThrough(
      new DecompressionStream(compressionIdFromCode(encoded.compression))
    )
    .pipeTo(writeStreamToBytes(sink))
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
    .pipeTo(writeStreamToBytes(sink))
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

export function writeStreamToBytes(sink: {
  bytes: Uint8Array
}): WritableStream {
  let position = 0
  return new WritableStream({
    write(chunk: Uint8Array) {
      const end = position + chunk.length
      while (sink.bytes.length < end) {
        sink.bytes = growBytes(sink.bytes)
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

function growBytes(bytes: Uint8Array): Uint8Array {
  const bigger = new Uint8Array(bytes.length * 2)
  bigger.set(bytes)
  return bigger
}
