import * as proto from '../../src/proto/message';
import * as secp from '@noble/secp256k1';
import Signature from './Signature';
import PublicKey from './PublicKey';
import Payload from './Payload';
import { decrypt, encrypt } from './encryption';

// PrivateKey represents a secp256k1 private key.
export default class PrivateKey implements proto.PrivateKey {
  secp256k1: proto.PrivateKey_Secp256k1 | undefined;
  publicKey?: PublicKey; // caches corresponding PublicKey

  constructor(obj: proto.PrivateKey) {
    if (!obj.secp256k1) {
      throw new Error('invalid private key');
    }
    if (obj.secp256k1.bytes.length !== 32) {
      throw new Error(
        `invalid private key length: ${obj.secp256k1.bytes.length}`
      );
    }
    this.secp256k1 = obj.secp256k1;
  }

  // Generates a new secp256k1 key pair.
  static generateKeys(): [PrivateKey, PublicKey] {
    const pri = PrivateKey.generate();
    return [pri, pri.getPublicKey()];
  }

  // create a random PrivateKey.
  static generate(): PrivateKey {
    return new PrivateKey({
      secp256k1: {
        bytes: secp.utils.randomPrivateKey()
      }
    });
  }

  // sign provided digest
  async sign(digest: Uint8Array): Promise<Signature> {
    if (!this.secp256k1) {
      throw new Error('invalid private key');
    }
    const [signature, recovery] = await secp.sign(
      digest,
      this.secp256k1.bytes,
      {
        recovered: true,
        der: false
      }
    );
    return new Signature({
      ecdsaCompact: { bytes: signature, recovery }
    });
  }

  // sign provided public key
  async signKey(pub: PublicKey): Promise<PublicKey> {
    if (!pub.secp256k1Uncompressed) {
      throw new Error('invalid public key');
    }
    const digest = await secp.utils.sha256(pub.secp256k1Uncompressed.bytes);
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
    if (!peer.secp256k1Uncompressed) {
      throw new Error('invalid public key');
    }
    if (!this.secp256k1) {
      throw new Error('invalid private key');
    }
    return secp.getSharedSecret(
      this.secp256k1.bytes,
      peer.secp256k1Uncompressed.bytes,
      false
    );
  }

  // encrypt plain bytes using a shared secret derived from peer's PublicKey;
  // additionalData allows including unencrypted parts of a Message in the authentication
  // protection provided by the encrypted part (to make the whole Message tamper evident)
  encrypt(
    plain: Uint8Array,
    peer: PublicKey,
    additionalData?: Uint8Array
  ): Promise<Payload> {
    const secret = this.sharedSecret(peer);
    return encrypt(plain, secret, additionalData);
  }

  // decrypt Payload using a shared secret derived from peer's PublicKey;
  // throws if any part of Payload or additionalData was tampered with
  decrypt(
    encrypted: Payload,
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

  toBytes(): Uint8Array {
    return proto.PrivateKey.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): PrivateKey {
    return new PrivateKey(proto.PrivateKey.decode(bytes));
  }
}
