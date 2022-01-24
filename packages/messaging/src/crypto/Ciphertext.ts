import * as proto from '../../src/proto/message';

export const AESKeySize = 32; // bytes
export const KDFSaltSize = 32; // bytes
// AES-GCM defaults from https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
export const AESGCMNonceSize = 12; // property iv
export const AESGCMTagLength = 16; // property tagLength

// Ciphertext packages the encrypted payload with the salt and nonce used to produce it.
// salt and nonce are not secret, and should be transmitted/stored along with the encrypted payload.
export default class Ciphertext {
  payload: Uint8Array; // at least AESGCMTagLength bytes
  salt: Uint8Array; // hkdf salt
  nonce: Uint8Array; // aes-256-gcm IV
  constructor(payload: Uint8Array, salt: Uint8Array, nonce: Uint8Array) {
    if (payload.length < AESGCMTagLength) {
      throw new Error(`invalid ciphertext payload length: ${payload.length}`);
    }
    if (salt.length !== KDFSaltSize) {
      throw new Error(`invalid ciphertext salt length: ${salt.length}`);
    }
    if (nonce.length !== AESGCMNonceSize) {
      throw new Error(`invalid ciphertext nonce length: ${nonce.length}`);
    }
    this.payload = payload;
    this.salt = salt;
    this.nonce = nonce;
  }

  // build Ciphertext from proto.Message
  static fromDecoded(payload: proto.Payload): Ciphertext {
    if (!payload) {
      throw new Error('missing message payload');
    }
    if (!payload.aes256GcmHkdfSha256) {
      throw new Error('unrecognized message payload');
    }
    return new Ciphertext(
      payload.aes256GcmHkdfSha256.payload,
      payload.aes256GcmHkdfSha256.hkdfSalt,
      payload.aes256GcmHkdfSha256.gcmNonce
    );
  }

  // build proto.Message from Ciphertext and the parties' KeyBundles.
  toBeEncoded(): proto.Payload {
    return {
      aes256GcmHkdfSha256: {
        payload: this.payload,
        hkdfSalt: this.salt,
        gcmNonce: this.nonce
      }
    };
  }
}
