import * as secp from '@noble/secp256k1'
import { crypto } from './encryption'

export function getRandomValues<T extends ArrayBufferView | null>(array: T): T {
  return crypto.getRandomValues(array)
}

export const bytesToHex = secp.utils.bytesToHex

export function hexToBytes(s: string): Uint8Array {
  if (s.startsWith('0x')) {
    s = s.slice(2)
  }
  const bytes = new Uint8Array(s.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const j = i * 2
    bytes[i] = Number.parseInt(s.slice(j, j + 2), 16)
  }
  return bytes
}

export function equalBytes(b1: Uint8Array, b2: Uint8Array): boolean {
  if (b1.length !== b2.length) {
    return false
  }
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) {
      return false
    }
  }
  return true
}
