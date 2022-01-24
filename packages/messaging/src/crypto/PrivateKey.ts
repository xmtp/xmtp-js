import * as proto from '../../src/proto/message';
import * as secp from '@noble/secp256k1';
import Signature from './Signature';
import PublicKey from './PublicKey';
import Ciphertext from './Ciphertext';
import { decrypt, encrypt } from './encryption';

// PrivateKey represents a secp256k1 private key.
export default class PrivateKey {
  bytes: Uint8Array; // 32 bytes of D
  publicKey?: PublicKey; // caches corresponding PublicKey
  constructor(bytes: Uint8Array) {
    if (bytes.length !== 32) {
      throw new Error(`invalid private key length: ${bytes.length}`);
    }
    this.bytes = bytes;
  }

  // Generates a new secp256k1 key pair.
  static generateKeys(): [PrivateKey, PublicKey] {
    const pri = PrivateKey.generate();
    return [pri, pri.getPublicKey()];
  }

  // create a random PrivateKey.
  static generate(): PrivateKey {
    return new PrivateKey(secp.utils.randomPrivateKey());
  }

  // create PrivateKey from 32 bytes of D
  static fromBytes(bytes: Uint8Array): PrivateKey {
    return new PrivateKey(bytes);
  }

  // sign provided digest
  async sign(digest: Uint8Array): Promise<Signature> {
    const [signature, recovery] = await secp.sign(digest, this.bytes, {
      recovered: true,
      der: false
    });
    return new Signature(signature, recovery);
  }

  // sign provided public key
  async signKey(pub: PublicKey): Promise<PublicKey> {
    const digest = await secp.utils.sha256(pub.bytes);
    pub.signature = await this.sign(digest);
    return pub;
  }

  // return corresponding PublicKey
  getPublicKey(): PublicKey {
    if (!this.publicKey) {
      this.publicKey = PublicKey.fromPrivateKey(this);
    }
    return this.publicKey;
  }

  // derive shared secret from peer's PublicKey;
  // the peer can derive the same secret using their PrivateKey and our PublicKey
  sharedSecret(peer: PublicKey): Uint8Array {
    return secp.getSharedSecret(this.bytes, peer.bytes, false);
  }

  // encrypt plain bytes using a shared secret derived from peer's PublicKey;
  // additionalData allows including unencrypted parts of a Message in the authentication
  // protection provided by the encrypted part (to make the whole Message tamper evident)
  encrypt(
    plain: Uint8Array,
    peer: PublicKey,
    additionalData?: Uint8Array
  ): Promise<Ciphertext> {
    const secret = this.sharedSecret(peer);
    return encrypt(plain, secret, additionalData);
  }

  // decrypt Ciphertext using a shared secret derived from peer's PublicKey;
  // throws if any part of Ciphertext or additionalData was tampered with
  decrypt(
    encrypted: Ciphertext,
    peer: PublicKey,
    additionalData?: Uint8Array
  ): Promise<Uint8Array> {
    const secret = this.sharedSecret(peer);
    return decrypt(encrypted, secret, additionalData);
  }

  // Does the provided PublicKey correspnd to this PrivateKey?
  matches(key: PublicKey): boolean {
    return this.getPublicKey().equals(key);
  }

  toBeEncoded(): proto.PrivateKey {
    return {
      secp256k1: {
        bytes: this.bytes
      }
    };
  }

  static fromDecoded(key: proto.PrivateKey): PrivateKey {
    if (!key.secp256k1) {
      throw new Error('unrecognized private key');
    }
    return new PrivateKey(key.secp256k1.bytes);
  }
}
