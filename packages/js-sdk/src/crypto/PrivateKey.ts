import * as secp from '@noble/secp256k1'
import { privateKey } from '@xmtp/proto'
import Long from 'long'
import type Ciphertext from './Ciphertext'
import { decrypt, encrypt, sha256 } from './encryption'
import { PublicKey, SignedPublicKey, UnsignedPublicKey } from './PublicKey'
import Signature, {
  ecdsaSignerKey,
  type ECDSACompactWithRecovery,
  type KeySigner,
} from './Signature'
import { equalBytes } from './utils'

// SECP256k1 private key
type secp256k1 = {
  bytes: Uint8Array // D big-endian, 32 bytes
}

// Validate SECP256k1 private key
function secp256k1Check(key: secp256k1): void {
  if (key.bytes.length !== 32) {
    throw new Error(`invalid private key length: ${key.bytes.length}`)
  }
}

// A private key signed with another key pair or a wallet.
export class SignedPrivateKey
  implements privateKey.SignedPrivateKey, KeySigner
{
  createdNs: Long // time the key was generated, ns since epoch
  secp256k1: secp256k1 // eslint-disable-line camelcase
  publicKey: SignedPublicKey // caches corresponding PublicKey

  constructor(obj: privateKey.SignedPrivateKey) {
    if (!obj.secp256k1) {
      throw new Error('invalid private key')
    }
    secp256k1Check(obj.secp256k1)
    this.secp256k1 = obj.secp256k1
    this.createdNs = obj.createdNs
    if (!obj.publicKey) {
      throw new Error('missing public key')
    }
    this.publicKey = new SignedPublicKey(obj.publicKey)
  }

  // Create a random key pair signed by the signer.
  static async generate(signer: KeySigner): Promise<SignedPrivateKey> {
    const secp256k1 = {
      bytes: secp.utils.randomPrivateKey(),
    }
    const createdNs = Long.fromNumber(new Date().getTime()).mul(1000000)
    const unsigned = new UnsignedPublicKey({
      secp256k1Uncompressed: {
        bytes: secp.getPublicKey(secp256k1.bytes),
      },
      createdNs,
    })
    const signed = await signer.signKey(unsigned)
    return new SignedPrivateKey({
      secp256k1,
      createdNs,
      publicKey: signed,
    })
  }

  // Time the key was generated.
  generated(): Date | undefined {
    return new Date(this.createdNs.div(1000000).toNumber())
  }

  // Sign provided digest.
  async sign(digest: Uint8Array): Promise<Signature> {
    const [signature, recovery] = await secp.sign(
      digest,
      this.secp256k1.bytes,
      {
        recovered: true,
        der: false,
      }
    )
    return new Signature({
      ecdsaCompact: { bytes: signature, recovery },
    })
  }

  // Sign provided public key.
  async signKey(pub: UnsignedPublicKey): Promise<SignedPublicKey> {
    const keyBytes = pub.toBytes()
    const digest = await sha256(keyBytes)
    const signature = await this.sign(digest)
    return new SignedPublicKey({
      keyBytes,
      signature,
    })
  }

  // Return public key of the signer of the provided signed key.
  static async signerKey(
    key: SignedPublicKey,
    signature: ECDSACompactWithRecovery
  ): Promise<UnsignedPublicKey | undefined> {
    const digest = await sha256(key.bytesToSign())
    return ecdsaSignerKey(digest, signature)
  }

  // Derive shared secret from peer's PublicKey;
  // the peer can derive the same secret using their private key and our public key.
  sharedSecret(peer: SignedPublicKey | UnsignedPublicKey): Uint8Array {
    return secp.getSharedSecret(
      this.secp256k1.bytes,
      peer.secp256k1Uncompressed.bytes,
      false
    )
  }

  // encrypt plain bytes using a shared secret derived from peer's PublicKey;
  // additionalData allows including unencrypted parts of a Message in the authentication
  // protection provided by the encrypted part (to make the whole Message tamper evident)
  encrypt(
    plain: Uint8Array,
    peer: UnsignedPublicKey,
    additionalData?: Uint8Array
  ): Promise<Ciphertext> {
    const secret = this.sharedSecret(peer)
    return encrypt(plain, secret, additionalData)
  }

  // decrypt Ciphertext using a shared secret derived from peer's PublicKey;
  // throws if any part of Ciphertext or additionalData was tampered with
  decrypt(
    encrypted: Ciphertext,
    peer: UnsignedPublicKey,
    additionalData?: Uint8Array
  ): Promise<Uint8Array> {
    const secret = this.sharedSecret(peer)
    return decrypt(encrypted, secret, additionalData)
  }

  // Does the provided PublicKey correspond to this PrivateKey?
  matches(key: SignedPublicKey): boolean {
    return this.publicKey.equals(key)
  }

  // Is other the same/equivalent key?
  equals(other: this): boolean {
    return (
      equalBytes(this.secp256k1.bytes, other.secp256k1.bytes) &&
      this.publicKey.equals(other.publicKey)
    )
  }

  // Encode this key into bytes.
  toBytes(): Uint8Array {
    return privateKey.SignedPrivateKey.encode(this).finish()
  }

  validatePublicKey(): boolean {
    const generatedPublicKey = secp.getPublicKey(this.secp256k1.bytes)
    return equalBytes(
      generatedPublicKey,
      this.publicKey.secp256k1Uncompressed.bytes
    )
  }

  // Decode key from bytes.
  static fromBytes(bytes: Uint8Array): SignedPrivateKey {
    return new SignedPrivateKey(privateKey.SignedPrivateKey.decode(bytes))
  }

  static fromLegacyKey(
    key: PrivateKey,
    signedByWallet?: boolean
  ): SignedPrivateKey {
    return new SignedPrivateKey({
      createdNs: key.timestamp.mul(1000000),
      secp256k1: key.secp256k1,
      publicKey: SignedPublicKey.fromLegacyKey(key.publicKey, signedByWallet),
    })
  }
}

// LEGACY: PrivateKey represents a secp256k1 private key.
export class PrivateKey implements privateKey.PrivateKey {
  timestamp: Long
  secp256k1: secp256k1 // eslint-disable-line camelcase
  publicKey: PublicKey // caches corresponding PublicKey

  constructor(obj: privateKey.PrivateKey) {
    if (!obj.secp256k1) {
      throw new Error('invalid private key')
    }
    secp256k1Check(obj.secp256k1)
    this.timestamp = obj.timestamp
    this.secp256k1 = obj.secp256k1
    if (!obj.publicKey) {
      throw new Error('missing public key')
    }
    this.publicKey = new PublicKey(obj.publicKey)
  }

  // create a random PrivateKey/PublicKey pair.
  static generate(): PrivateKey {
    const secp256k1 = {
      bytes: secp.utils.randomPrivateKey(),
    }
    const timestamp = Long.fromNumber(new Date().getTime())
    return new PrivateKey({
      secp256k1,
      timestamp,
      publicKey: new PublicKey({
        secp256k1Uncompressed: {
          bytes: secp.getPublicKey(secp256k1.bytes),
        },
        timestamp,
      }),
    })
  }

  generated(): Date | undefined {
    return new Date(this.timestamp.toNumber())
  }

  // sign provided digest
  async sign(digest: Uint8Array): Promise<Signature> {
    const [signature, recovery] = await secp.sign(
      digest,
      this.secp256k1.bytes,
      {
        recovered: true,
        der: false,
      }
    )
    return new Signature({
      ecdsaCompact: { bytes: signature, recovery },
    })
  }

  // sign provided public key
  async signKey(pub: PublicKey): Promise<PublicKey> {
    const digest = await sha256(pub.bytesToSign())
    pub.signature = await this.sign(digest)
    return pub
  }

  // derive shared secret from peer's PublicKey;
  // the peer can derive the same secret using their PrivateKey and our PublicKey
  sharedSecret(peer: PublicKey | SignedPublicKey): Uint8Array {
    return secp.getSharedSecret(
      this.secp256k1.bytes,
      peer.secp256k1Uncompressed.bytes,
      false
    )
  }

  // encrypt plain bytes using a shared secret derived from peer's PublicKey;
  // additionalData allows including unencrypted parts of a Message in the authentication
  // protection provided by the encrypted part (to make the whole Message tamper evident)
  encrypt(
    plain: Uint8Array,
    peer: PublicKey,
    additionalData?: Uint8Array
  ): Promise<Ciphertext> {
    const secret = this.sharedSecret(peer)
    return encrypt(plain, secret, additionalData)
  }

  // decrypt Ciphertext using a shared secret derived from peer's PublicKey;
  // throws if any part of Ciphertext or additionalData was tampered with
  decrypt(
    encrypted: Ciphertext,
    peer: PublicKey,
    additionalData?: Uint8Array
  ): Promise<Uint8Array> {
    const secret = this.sharedSecret(peer)
    return decrypt(encrypted, secret, additionalData)
  }

  // Does the provided PublicKey correspond to this PrivateKey?
  matches(key: PublicKey): boolean {
    return this.publicKey.equals(key)
  }

  validatePublicKey(): boolean {
    const generatedPublicKey = secp.getPublicKey(this.secp256k1.bytes)
    return equalBytes(
      generatedPublicKey,
      this.publicKey.secp256k1Uncompressed.bytes
    )
  }

  // Encode this key into bytes.
  toBytes(): Uint8Array {
    return privateKey.PrivateKey.encode(this).finish()
  }

  // Decode key from bytes.
  static fromBytes(bytes: Uint8Array): PrivateKey {
    return new PrivateKey(privateKey.PrivateKey.decode(bytes))
  }
}
