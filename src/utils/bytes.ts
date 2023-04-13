import { fetcher } from '@xmtp/proto'

export const { b64Decode, b64Encode } = fetcher

export function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const ab = new Uint8Array(a.length + b.length)
  ab.set(a)
  ab.set(b, a.length)
  return ab
}
