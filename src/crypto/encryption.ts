import Ciphertext, { AESGCMNonceSize, KDFSaltSize } from './Ciphertext'

// crypto should provide access to standard Web Crypto API
// in both the browser environment and node.
export const crypto: Crypto =
  typeof window !== 'undefined'
    ? window.crypto
    : // eslint-disable-next-line @typescript-eslint/no-var-requires
      (require('crypto').webcrypto as unknown as Crypto)

const hkdfNoInfo = new ArrayBuffer(0)

// This is a variation of https://github.com/paulmillr/noble-secp256k1/blob/main/index.ts#L1378-L1388
// that uses `digest('SHA-256', bytes)` instead of `digest('SHA-256', bytes.buffer)`
// which seems to produce different results.
export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
}

// symmetric authenticated encryption of plaintext using the secret;
// additionalData is used to protect un-encrypted parts of the message (header)
// in the authentication scope of the encryption.
export async function encrypt(
  plain: Uint8Array,
  secret: Uint8Array,
  additionalData?: Uint8Array
): Promise<Ciphertext> {
  const salt = crypto.getRandomValues(new Uint8Array(KDFSaltSize))
  const nonce = crypto.getRandomValues(new Uint8Array(AESGCMNonceSize))
  const key = await hkdf(secret, salt)
  const encrypted: ArrayBuffer = await crypto.subtle.encrypt(
    aesGcmParams(nonce, additionalData),
    key,
    plain
  )
  return new Ciphertext({
    aes256GcmHkdfSha256: {
      payload: new Uint8Array(encrypted),
      hkdfSalt: salt,
      gcmNonce: nonce,
    },
  })
}

// symmetric authenticated decryption of the encrypted ciphertext using the secret and additionalData
export async function decrypt(
  encrypted: Ciphertext,
  secret: Uint8Array,
  additionalData?: Uint8Array
): Promise<Uint8Array> {
  if (!encrypted.aes256GcmHkdfSha256) {
    throw new Error('invalid payload ciphertext')
  }
  const key = await hkdf(secret, encrypted.aes256GcmHkdfSha256.hkdfSalt)
  const decrypted: ArrayBuffer = await crypto.subtle.decrypt(
    aesGcmParams(encrypted.aes256GcmHkdfSha256.gcmNonce, additionalData),
    key,
    encrypted.aes256GcmHkdfSha256.payload
  )
  return new Uint8Array(decrypted)
}

// helper for building Web Crypto API encryption parameter structure
function aesGcmParams(
  nonce: Uint8Array,
  additionalData?: Uint8Array
): AesGcmParams {
  const spec: AesGcmParams = {
    name: 'AES-GCM',
    iv: nonce,
  }
  if (additionalData) {
    spec.additionalData = additionalData
  }
  return spec
}

// Derive AES-256-GCM key from a shared secret and salt.
// Returns crypto.CryptoKey suitable for the encrypt/decrypt API
async function hkdf(secret: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey('raw', secret, 'HKDF', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: hkdfNoInfo },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}
