import * as proto from '../proto/messaging'

export const AESKeySize = 32 // bytes
export const KDFSaltSize = 32 // bytes
// AES-GCM defaults from https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
export const AESGCMNonceSize = 12 // property iv
export const AESGCMTagLength = 16 // property tagLength

// Ciphertext packages the encrypted ciphertext with the salt and nonce used to produce it.
// salt and nonce are not secret, and should be transmitted/stored along with the encrypted ciphertext.
export default class Ciphertext implements proto.Ciphertext {
  aes256GcmHkdfSha256: proto.Ciphertext_Aes256gcmHkdfsha256 | undefined // eslint-disable-line camelcase

  constructor(obj: proto.Ciphertext) {
    if (!obj.aes256GcmHkdfSha256) {
      throw new Error('invalid ciphertext')
    }
    if (obj.aes256GcmHkdfSha256.payload.length < AESGCMTagLength) {
      throw new Error(
        `invalid ciphertext ciphertext length: ${obj.aes256GcmHkdfSha256.payload.length}`
      )
    }
    if (obj.aes256GcmHkdfSha256.hkdfSalt.length !== KDFSaltSize) {
      throw new Error(
        `invalid ciphertext salt length: ${obj.aes256GcmHkdfSha256.hkdfSalt.length}`
      )
    }
    if (obj.aes256GcmHkdfSha256.gcmNonce.length !== AESGCMNonceSize) {
      throw new Error(
        `invalid ciphertext nonce length: ${obj.aes256GcmHkdfSha256.gcmNonce.length}`
      )
    }
    this.aes256GcmHkdfSha256 = obj.aes256GcmHkdfSha256
  }

  toBytes(): Uint8Array {
    return proto.Ciphertext.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): Ciphertext {
    return new Ciphertext(proto.Ciphertext.decode(bytes))
  }
}
