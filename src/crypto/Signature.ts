import { signature } from '@xmtp/proto'
import Long from 'long'
import * as secp from '@noble/secp256k1'
import { PublicKey, UnsignedPublicKey, SignedPublicKey } from './PublicKey'
import { SignedPrivateKey } from './PrivateKey'
import { Signer, utils } from 'ethers'
import { bytesToHex, equalBytes, hexToBytes } from './utils'

// ECDSA signature with recovery bit.
export type ECDSACompactWithRecovery = {
  bytes: Uint8Array // compact representation [ R || S ], 64 bytes
  recovery: number // recovery bit
}

// Validate signature.
function ecdsaCheck(sig: ECDSACompactWithRecovery): void {
  if (sig.bytes.length !== 64) {
    throw new Error(`invalid signature length: ${sig.bytes.length}`)
  }
  if (sig.recovery !== 0 && sig.recovery !== 1) {
    throw new Error(`invalid recovery bit: ${sig.recovery}`)
  }
}

// Compare signatures.
function ecdsaEqual(
  a: ECDSACompactWithRecovery,
  b: ECDSACompactWithRecovery
): boolean {
  return a.recovery === b.recovery && equalBytes(a.bytes, b.bytes)
}

// Derive public key of the signer from the digest and the signature.
export function ecdsaSignerKey(
  digest: Uint8Array,
  signature: ECDSACompactWithRecovery
): UnsignedPublicKey | undefined {
  const bytes = secp.recoverPublicKey(
    digest,
    signature.bytes,
    signature.recovery
  )
  return bytes
    ? new UnsignedPublicKey({
        secp256k1Uncompressed: { bytes },
        createdNs: Long.fromNumber(0),
      })
    : undefined
}

export default class Signature implements signature.Signature {
  // SECP256k1/SHA256 ECDSA signature
  ecdsaCompact: ECDSACompactWithRecovery | undefined // eslint-disable-line camelcase
  // SECP256k1/keccak256 ECDSA signature created with ethers.Signer.signMessage (see WalletSigner)
  walletEcdsaCompact: ECDSACompactWithRecovery | undefined // eslint-disable-line camelcase

  constructor(obj: Partial<signature.Signature>) {
    if (obj.ecdsaCompact) {
      ecdsaCheck(obj.ecdsaCompact)
      this.ecdsaCompact = obj.ecdsaCompact
    } else if (obj.walletEcdsaCompact) {
      ecdsaCheck(obj.walletEcdsaCompact)
      this.walletEcdsaCompact = obj.walletEcdsaCompact
    } else {
      throw new Error('invalid signature')
    }
  }

  // Return the public key that validates provided key's signature.
  async signerKey(
    key: SignedPublicKey
  ): Promise<UnsignedPublicKey | undefined> {
    if (this.ecdsaCompact) {
      return SignedPrivateKey.signerKey(key, this.ecdsaCompact)
    } else if (this.walletEcdsaCompact) {
      return WalletSigner.signerKey(key, this.walletEcdsaCompact)
    } else {
      return undefined
    }
  }

  // LEGACY: Return the public key that validates this signature given the provided digest.
  // Return undefined if the signature is malformed.
  getPublicKey(digest: Uint8Array): PublicKey | undefined {
    if (!this.ecdsaCompact) {
      throw new Error('invalid signature')
    }
    const bytes = secp.recoverPublicKey(
      digest,
      this.ecdsaCompact.bytes,
      this.ecdsaCompact.recovery
    )
    return bytes
      ? new PublicKey({
          secp256k1Uncompressed: { bytes },
          timestamp: Long.fromNumber(0),
        })
      : undefined
  }

  // Is this the same/equivalent signature as other?
  equals(other: Signature): boolean {
    if (this.ecdsaCompact && other.ecdsaCompact) {
      return ecdsaEqual(this.ecdsaCompact, other.ecdsaCompact)
    }
    if (this.walletEcdsaCompact && other.walletEcdsaCompact) {
      return ecdsaEqual(this.walletEcdsaCompact, other.walletEcdsaCompact)
    }
    return false
  }

  toBytes(): Uint8Array {
    return signature.Signature.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): Signature {
    return new Signature(signature.Signature.decode(bytes))
  }
}

// A signer that can be used to sign public keys.
export interface KeySigner {
  signKey(key: UnsignedPublicKey): Promise<SignedPublicKey>
}

// A wallet based KeySigner.
export class WalletSigner implements KeySigner {
  wallet: Signer

  constructor(wallet: Signer) {
    this.wallet = wallet
  }

  static identitySigRequestText(keyBytes: Uint8Array): string {
    // Note that an update to this signature request text will require
    // addition of backward compatibility for existing signatures
    // and/or a migration; otherwise clients will fail to verify previously
    // signed keys.
    return (
      'XMTP : Create Identity\n' +
      `${bytesToHex(keyBytes)}\n` +
      '\n' +
      'For more info: https://xmtp.org/signatures/'
    )
  }

  static signerKey(
    key: SignedPublicKey,
    signature: ECDSACompactWithRecovery
  ): UnsignedPublicKey | undefined {
    const digest = hexToBytes(
      utils.hashMessage(this.identitySigRequestText(key.bytesToSign()))
    )
    return ecdsaSignerKey(digest, signature)
  }

  async signKey(key: UnsignedPublicKey): Promise<SignedPublicKey> {
    const keyBytes = key.toBytes()
    const sigString = await this.wallet.signMessage(
      WalletSigner.identitySigRequestText(keyBytes)
    )
    const eSig = utils.splitSignature(sigString)
    const r = hexToBytes(eSig.r)
    const s = hexToBytes(eSig.s)
    const sigBytes = new Uint8Array(64)
    sigBytes.set(r)
    sigBytes.set(s, r.length)
    const signature = new Signature({
      walletEcdsaCompact: {
        bytes: sigBytes,
        recovery: eSig.recoveryParam,
      },
    })
    return new SignedPublicKey({ keyBytes, signature })
  }
}
