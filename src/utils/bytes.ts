import { fetcher } from '@xmtp/proto'

export const { b64Decode, b64Encode } = fetcher

export function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const ab = new Uint8Array(a.length + b.length)
  ab.set(a)
  ab.set(b, a.length)
  return ab
}

export function numberToUint8Array(num: number) {
  // Create a buffer for a 32-bit integer
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)

  // Set the number in the buffer
  view.setInt32(0, num, true) // true for little-endian

  // Create Uint8Array from buffer
  return new Uint8Array(buffer)
}

export function uint8ArrayToNumber(arr: Uint8Array) {
  const buffer = arr.buffer
  const view = new DataView(buffer)

  // Read the number from the buffer
  return view.getInt32(0, true) // true for little-endian
}
