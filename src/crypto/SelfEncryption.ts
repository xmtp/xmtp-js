import {
  // eslint-disable-next-line camelcase
  ecies_decrypt_k256_sha3_256,
  // eslint-disable-next-line camelcase
  ecies_encrypt_k256_sha3_256,
} from '@xmtp/ecies-bindings-wasm'
import { PrivateKey } from '.'

// Uses ECIES to encrypt messages where the sender and recipient are the same
export default class SelfEncryption {
  privateKey: PrivateKey

  constructor(identityKey: PrivateKey) {
    this.privateKey = identityKey
  }

  encrypt(data: Uint8Array): Uint8Array {
    return ecies_encrypt_k256_sha3_256(
      this.privateKey.publicKey.secp256k1Uncompressed.bytes,
      this.privateKey.secp256k1.bytes,
      data
    )
  }

  decrypt(message: Uint8Array): Uint8Array {
    return ecies_decrypt_k256_sha3_256(
      this.privateKey.publicKey.secp256k1Uncompressed.bytes,
      this.privateKey.secp256k1.bytes,
      message
    )
  }
}
