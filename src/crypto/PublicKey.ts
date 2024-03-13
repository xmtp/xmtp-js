import * as secp from '@noble/secp256k1'
import { publicKey } from '@xmtp/proto'
import Long from 'long'
import { hashMessage, hexToBytes, type Hex } from 'viem'
import type { Signer } from '@/types/Signer'
import { sha256 } from './encryption'
import Signature, { WalletSigner } from './Signature'
import { computeAddress, equalBytes, splitSignature } from './utils'

// SECP256k1 public key in uncompressed format with prefix
type secp256k1Uncompressed = {
  // uncompressed point with prefix (0x04) [ P || X || Y ], 65 bytes
  bytes: Uint8Array
}

// Validate a key.
function secp256k1UncompressedCheck(key: secp256k1Uncompressed): void {
  if (key.bytes.length !== 65) {
    throw new Error(`invalid public key length: ${key.bytes.length}`)
  }
  if (key.bytes[0] !== 4) {
    throw new Error(`unrecognized public key prefix: ${key.bytes[0]}`)
  }
}

const MS_NS_TIMESTAMP_THRESHOLD = new Long(10 ** 9).mul(10 ** 9)

// Basic public key without a signature.
export class UnsignedPublicKey implements publicKey.UnsignedPublicKey {
  // time the key was generated, normally ns since epoch, however
  // to allow transparent conversion of pre-existing signed PublicKey to SignedPublicKey
  // it can also be ms since epoch; use MS_NS_TIMESTAMP_THRESHOLD to distinguish
  // the two cases.
  createdNs: Long
  secp256k1Uncompressed: secp256k1Uncompressed // eslint-disable-line camelcase

  constructor(obj: publicKey.UnsignedPublicKey) {
    if (!obj?.secp256k1Uncompressed) {
      throw new Error('invalid public key')
    }
    secp256k1UncompressedCheck(obj.secp256k1Uncompressed)
    this.secp256k1Uncompressed = obj.secp256k1Uncompressed
    this.createdNs = obj.createdNs.toUnsigned()
  }

  // The time the key was generated.
  generated(): Date | undefined {
    return new Date(this.timestamp.toNumber())
  }

  isFromLegacyKey(): boolean {
    return this.createdNs.lessThan(MS_NS_TIMESTAMP_THRESHOLD)
  }

  // creation time in milliseconds
  get timestamp(): Long {
    return (
      this.isFromLegacyKey() ? this.createdNs : this.createdNs.div(1000000)
    ).toUnsigned()
  }

  // Verify that signature was created from the digest using matching private key.
  verify(signature: Signature, digest: Uint8Array): boolean {
    if (!signature.ecdsaCompact) {
      return false
    }
    return secp.verify(
      signature.ecdsaCompact.bytes,
      digest,
      this.secp256k1Uncompressed.bytes
    )
  }

  // Verify that the provided public key was signed by matching private key.
  async verifyKey(pub: PublicKey | SignedPublicKey): Promise<boolean> {
    if (!pub.signature) {
      return false
    }
    const digest = await sha256(pub.bytesToSign())
    return this.verify(pub.signature, digest)
  }

  // Is other the same/equivalent public key?
  equals(other: this): boolean {
    return equalBytes(
      this.secp256k1Uncompressed.bytes,
      other.secp256k1Uncompressed.bytes
    )
  }

  // Derive Ethereum address from this public key.
  getEthereumAddress(): string {
    return computeAddress(this.secp256k1Uncompressed.bytes)
  }

  // Encode public key into bytes.
  toBytes(): Uint8Array {
    return publicKey.UnsignedPublicKey.encode(this).finish()
  }

  // Decode public key from bytes.
  static fromBytes(bytes: Uint8Array): UnsignedPublicKey {
    return new UnsignedPublicKey(publicKey.UnsignedPublicKey.decode(bytes))
  }
}

// Public key signed by another key pair or a wallet.
export class SignedPublicKey
  extends UnsignedPublicKey
  implements publicKey.SignedPublicKey
{
  keyBytes: Uint8Array // caches the bytes of the encoded unsigned key
  signature: Signature

  constructor(obj: publicKey.SignedPublicKey) {
    if (!obj.keyBytes) {
      throw new Error('missing key bytes')
    }
    super(publicKey.UnsignedPublicKey.decode(obj.keyBytes))
    this.keyBytes = obj.keyBytes
    if (!obj.signature) {
      throw new Error('missing key signature')
    }
    this.signature = new Signature(obj.signature)
  }

  // Return the key without the signature.
  get unsignedKey(): UnsignedPublicKey {
    return new UnsignedPublicKey({
      createdNs: this.createdNs,
      secp256k1Uncompressed: this.secp256k1Uncompressed,
    })
  }

  // Return public key of the signer of this key.
  signerKey(): Promise<UnsignedPublicKey | undefined> {
    return this.signature.signerKey(this)
  }

  // Assume the key was signed by a wallet and
  // return the wallet address that validates
  // the signature of this key.
  async walletSignatureAddress(): Promise<string> {
    if (!this.signature.walletEcdsaCompact) {
      throw new Error('key was not signed by a wallet')
    }
    const pk = await this.signerKey()
    if (!pk) {
      throw new Error('key signature not valid')
    }
    return pk.getEthereumAddress()
  }

  // Is other the same/equivalent public key?
  equals(other: this): boolean {
    return (
      this.unsignedKey.equals(other.unsignedKey) &&
      this.signature.equals(other.signature)
    )
  }

  // Return bytes of the encoded unsigned key.
  bytesToSign(): Uint8Array {
    return this.keyBytes
  }

  // Encode signed key into bytes.
  toBytes(): Uint8Array {
    return publicKey.SignedPublicKey.encode(this).finish()
  }

  // Decode signed key from bytes.
  static fromBytes(bytes: Uint8Array): SignedPublicKey {
    return new SignedPublicKey(publicKey.SignedPublicKey.decode(bytes))
  }

  toLegacyKey(): PublicKey {
    if (!this.isFromLegacyKey()) {
      throw new Error('cannot be converted to legacy key')
    }
    let signature = this.signature
    if (signature.walletEcdsaCompact) {
      signature = new Signature({
        ecdsaCompact: signature.walletEcdsaCompact,
      })
    }
    return new PublicKey({
      timestamp: this.timestamp,
      secp256k1Uncompressed: this.secp256k1Uncompressed,
      signature,
    })
  }

  static fromLegacyKey(
    legacyKey: PublicKey,
    signedByWallet?: boolean
  ): SignedPublicKey {
    if (!legacyKey.signature) {
      throw new Error('key is not signed')
    }
    let signature = legacyKey.signature
    if (signedByWallet) {
      signature = new Signature({
        walletEcdsaCompact: signature.ecdsaCompact,
      })
    }
    return new SignedPublicKey({
      keyBytes: legacyKey.bytesToSign(),
      signature,
    })
  }
}

// LEGACY: PublicKey optionally signed with another trusted key pair or a wallet.
// PublicKeys can be generated through PrivateKey.generate()
export class PublicKey
  extends UnsignedPublicKey
  implements publicKey.PublicKey
{
  signature?: Signature

  constructor(obj: publicKey.PublicKey) {
    super({
      createdNs: obj.timestamp.mul(1000000),
      secp256k1Uncompressed: obj.secp256k1Uncompressed,
    })
    if (obj.signature) {
      // Handle a case where Flutter was publishing signatures with walletEcdsaCompact
      // instead of ecdsaCompact for v1 keys.
      if (!obj.signature.ecdsaCompact && obj.signature.walletEcdsaCompact) {
        this.signature = new Signature({
          ecdsaCompact: {
            bytes: obj.signature.walletEcdsaCompact.bytes,
            recovery: obj.signature.walletEcdsaCompact.recovery,
          },
        })
      } else {
        this.signature = new Signature(obj.signature)
      }
    }
  }

  get timestamp(): Long {
    return this.createdNs.div(1000000)
  }

  bytesToSign(): Uint8Array {
    return publicKey.PublicKey.encode({
      timestamp: this.timestamp,
      secp256k1Uncompressed: this.secp256k1Uncompressed,
    }).finish()
  }

  // sign the key using a wallet
  async signWithWallet(wallet: Signer): Promise<void> {
    const sigString = await wallet.signMessage(
      WalletSigner.identitySigRequestText(this.bytesToSign())
    )
    const { bytes, recovery } = splitSignature(sigString as Hex)
    this.signature = new Signature({
      ecdsaCompact: {
        bytes,
        recovery,
      },
    })
  }

  // Assume the key was signed by a wallet and
  // return the wallet address that validates
  // the signature for this key.
  walletSignatureAddress(): string {
    if (!this.signature) {
      throw new Error('key is not signed')
    }
    const digest = hexToBytes(
      hashMessage(WalletSigner.identitySigRequestText(this.bytesToSign()))
    )
    const pk = this.signature.getPublicKey(digest)
    if (!pk) {
      throw new Error('key signature is malformed')
    }
    return pk.getEthereumAddress()
  }

  toBytes(): Uint8Array {
    return publicKey.PublicKey.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): PublicKey {
    return new PublicKey(publicKey.PublicKey.decode(bytes))
  }
}
