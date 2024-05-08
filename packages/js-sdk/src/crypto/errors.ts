import type { PublicKey, SignedPublicKey } from './PublicKey'
import { bytesToHex } from './utils'

export class NoMatchingPreKeyError extends Error {
  constructor(preKey: PublicKey | SignedPublicKey) {
    super(
      `no pre-key matches: ${bytesToHex(preKey.secp256k1Uncompressed.bytes)}`
    )
  }
}
