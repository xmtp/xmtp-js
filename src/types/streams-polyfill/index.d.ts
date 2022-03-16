declare class DecompressionStream {
  constructor(format: string)

  readonly readable: ReadableStream<BufferSource>
  readonly writable: WritableStream<Uint8Array>
}

declare class CompressionStream {
  constructor(format: string)

  readonly readable: ReadableStream<BufferSource>
  readonly writable: WritableStream<Uint8Array>
}
