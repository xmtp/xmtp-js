import { publicKey } from '@xmtp/proto'
import { PublicKey, SignedPublicKey } from './PublicKey'

// LEGACY: PublicKeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey must be signed by the wallet to authenticate it.
export class SignedPublicKeyBundle implements publicKey.SignedPublicKeyBundle {
  identityKey: SignedPublicKey
  preKey: SignedPublicKey

  constructor(bundle: publicKey.SignedPublicKeyBundle) {
    if (!bundle.identityKey) {
      throw new Error('missing identity key')
    }
    if (!bundle.preKey) {
      throw new Error('missing pre-key')
    }
    this.identityKey = new SignedPublicKey(bundle.identityKey)
    this.preKey = new SignedPublicKey(bundle.preKey)
  }

  walletSignatureAddress(): Promise<string> {
    return this.identityKey.walletSignatureAddress()
  }

  equals(other: this): boolean {
    return (
      this.identityKey.equals(other.identityKey) &&
      this.preKey.equals(other.preKey)
    )
  }

  toBytes(): Uint8Array {
    return publicKey.SignedPublicKeyBundle.encode(this).finish()
  }

  isFromLegacyBundle(): boolean {
    return this.identityKey.isFromLegacyKey() && this.preKey.isFromLegacyKey()
  }

  toLegacyBundle(): PublicKeyBundle {
    return new PublicKeyBundle({
      identityKey: this.identityKey.toLegacyKey(),
      preKey: this.preKey.toLegacyKey(),
    })
  }

  static fromBytes(bytes: Uint8Array): SignedPublicKeyBundle {
    const decoded = publicKey.SignedPublicKeyBundle.decode(bytes)
    return new SignedPublicKeyBundle(decoded)
  }

  static fromLegacyBundle(bundle: PublicKeyBundle): SignedPublicKeyBundle {
    return new SignedPublicKeyBundle({
      // Note: I am assuming all PublicKeyBundles passed into this have had their identity keys signed by a wallet
      // Maybe that is not universally true in the future
      identityKey: SignedPublicKey.fromLegacyKey(bundle.identityKey, true),
      preKey: SignedPublicKey.fromLegacyKey(bundle.preKey),
    })
  }
}

// LEGACY: PublicKeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey can be signed by the wallet to authenticate it.
export class PublicKeyBundle implements publicKey.PublicKeyBundle {
  identityKey: PublicKey
  preKey: PublicKey

  constructor(bundle: publicKey.PublicKeyBundle) {
    if (!bundle.identityKey) {
      throw new Error('missing identity key')
    }
    if (!bundle.preKey) {
      throw new Error('missing pre-key')
    }
    this.identityKey = new PublicKey(bundle.identityKey)
    this.preKey = new PublicKey(bundle.preKey)
  }

  equals(other: this): boolean {
    return (
      this.identityKey.equals(other.identityKey) &&
      this.preKey.equals(other.preKey)
    )
  }

  walletSignatureAddress(): string {
    return this.identityKey.walletSignatureAddress()
  }

  toBytes(): Uint8Array {
    return publicKey.PublicKeyBundle.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): PublicKeyBundle {
    const decoded = publicKey.PublicKeyBundle.decode(bytes)
    return new PublicKeyBundle(decoded)
  }
}
