import { publicKey } from '@xmtp/proto'
import { PublicKey } from './PublicKey'

// PublicKeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey can be signed by the wallet to authenticate it.
export default class PublicKeyBundle implements publicKey.PublicKeyBundle {
  identityKey: PublicKey
  preKey: PublicKey

  constructor(identityKey: PublicKey, preKey: PublicKey) {
    if (!identityKey) {
      throw new Error('missing identity key')
    }
    if (!preKey) {
      throw new Error('missing pre-key')
    }
    this.identityKey = identityKey
    this.preKey = preKey
  }

  walletSignatureAddress(): string {
    return this.identityKey.walletSignatureAddress()
  }

  toBytes(): Uint8Array {
    return publicKey.PublicKeyBundle.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): PublicKeyBundle {
    const decoded = publicKey.PublicKeyBundle.decode(bytes)
    if (!decoded.identityKey) {
      throw new Error('missing identity key')
    }
    if (!decoded.preKey) {
      throw new Error('missing pre-key')
    }
    return new PublicKeyBundle(
      new PublicKey(decoded.identityKey),
      new PublicKey(decoded.preKey)
    )
  }
}
