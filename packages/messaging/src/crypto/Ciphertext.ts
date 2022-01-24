import * as proto from '../../src/proto/message';

export const AESKeySize = 32; // bytes
export const KDFSaltSize = 32; // bytes
// AES-GCM defaults from https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
export const AESGCMNonceSize = 12; // property iv
export const AESGCMTagLength = 16; // property tagLength

// Ciphertext packages the encrypted payload with the salt and nonce used to produce it.
// salt and nonce are not secret, and should be transmitted/stored along with the encrypted payload.
export default class Ciphertext implements proto.Payload_Aes256gcmHkdfsha256 {
  hkdfSalt: Uint8Array; // at least AESGCMTagLength bytes
  gcmNonce: Uint8Array; // hkdf salt
  payload: Uint8Array; // aes-256-gcm IV

  constructor(obj: proto.Payload_Aes256gcmHkdfsha256) {
    if (obj.payload.length < AESGCMTagLength) {
      throw new Error(
        `invalid ciphertext payload length: ${obj.payload.length}`
      );
    }
    if (obj.hkdfSalt.length !== KDFSaltSize) {
      throw new Error(`invalid ciphertext salt length: ${obj.hkdfSalt.length}`);
    }
    if (obj.gcmNonce.length !== AESGCMNonceSize) {
      throw new Error(
        `invalid ciphertext nonce length: ${obj.gcmNonce.length}`
      );
    }
    this.payload = obj.payload;
    this.hkdfSalt = obj.hkdfSalt;
    this.gcmNonce = obj.gcmNonce;
  }

  toBytes(): Uint8Array {
    return proto.Payload_Aes256gcmHkdfsha256.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): Ciphertext {
    return new Ciphertext(proto.Payload_Aes256gcmHkdfsha256.decode(bytes));
  }
}
