import PublicKey from './PublicKey'
import { bytesToHex } from './utils'

export class NoMatchingPreKeyError extends Error {
  constructor(peer: PublicKey) {
    super(`no pre-key matches: ${bytesToHex(peer.secp256k1Uncompressed)}`)
  }
}
