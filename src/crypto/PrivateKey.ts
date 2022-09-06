import { privateKey } from '@xmtp/proto'
import * as secp from '@noble/secp256k1'
import Long from 'long'
import Signature from './Signature'
import PublicKey from './PublicKey'
import Ciphertext from './Ciphertext'
import { decrypt, encrypt, sha256 } from './encryption'

// PrivateKey represents a secp256k1 private key.
export default class PrivateKey implements privateKey.PrivateKey {
  timestamp: Long
  secp256k1: privateKey.PrivateKey_Secp256k1 | undefined // eslint-disable-line camelcase
  publicKey: PublicKey // caches corresponding PublicKey

  constructor(obj: privateKey.PrivateKey) {
    if (!obj.secp256k1) {
      throw new Error('invalid private key')
    }
    if (obj.secp256k1.bytes.length !== 32) {
      throw new Error(
        `invalid private key length: ${obj.secp256k1.bytes.length}`
      )
    }
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
        timestamp: timestamp,
      }),
    })
  }

  generated(): Date | undefined {
    if (!this.timestamp) {
      return undefined
    }
    return new Date(this.timestamp.toNumber())
  }

  // sign provided digest
  async sign(digest: Uint8Array): Promise<Signature> {
    if (!this.secp256k1) {
      throw new Error('invalid private key')
    }
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
    if (!pub.secp256k1Uncompressed) {
      throw new Error('invalid public key')
    }
    const digest = await sha256(pub.bytesToSign())
    pub.signature = await this.sign(digest)
    return pub
  }

  // derive shared secret from peer's PublicKey;
  // the peer can derive the same secret using their PrivateKey and our PublicKey
  sharedSecret(peer: PublicKey): Uint8Array {
    if (!peer.secp256k1Uncompressed) {
      throw new Error('invalid public key')
    }
    if (!this.secp256k1) {
      throw new Error('invalid private key')
    }
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

  // Does the provided PublicKey correspnd to this PrivateKey?
  matches(key: PublicKey): boolean {
    return this.publicKey.equals(key)
  }

  toBytes(): Uint8Array {
    return privateKey.PrivateKey.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): PrivateKey {
    return new PrivateKey(privateKey.PrivateKey.decode(bytes))
  }
}
