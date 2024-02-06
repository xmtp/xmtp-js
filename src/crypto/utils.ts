import * as secp from '@noble/secp256k1'
import {
  Hex,
  getAddress,
  hexToSignature,
  keccak256,
  hexToBytes as viemHexToBytes,
  bytesToHex as viemBytesToHex,
} from 'viem'

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

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
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

/**
 * Compute the Ethereum address from uncompressed PublicKey bytes
 */
export function computeAddress(bytes: Uint8Array) {
  const publicKey = viemBytesToHex(bytes.slice(1)) as `0x${string}`
  const hash = keccak256(publicKey)
  const address = hash.substring(hash.length - 40)
  return getAddress(`0x${address}`)
}

/**
 * Split an Ethereum signature hex string into bytes and a recovery bit
 */
export function splitSignature(signature: Hex) {
  const eSig = hexToSignature(signature)
  const r = viemHexToBytes(eSig.r)
  const s = viemHexToBytes(eSig.s)
  let v = Number(eSig.v)
  if (v === 0 || v === 1) {
    v += 27
  }
  const recovery = 1 - (v % 2)
  const bytes = new Uint8Array(64)
  bytes.set(r)
  bytes.set(s, r.length)
  return { bytes, recovery }
}
