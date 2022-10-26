import { PublicKey, SignedPublicKey } from './PublicKey'
import { bytesToHex } from './utils'

export class NoMatchingPreKeyError extends Error {
  constructor(peer: PublicKey | SignedPublicKey) {
    super(`no pre-key matches: ${bytesToHex(peer.secp256k1Uncompressed.bytes)}`)
  }
}
