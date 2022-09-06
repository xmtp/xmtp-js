import Ciphertext, { AESGCMNonceSize, KDFSaltSize } from './Ciphertext'

import * as nodeCrypto from 'crypto'

// webcrypto should provide access to standard Web Crypto API
// in both the browser environment and node.
const webcrypto: Crypto =
  typeof window !== 'undefined'
    ? window.crypto
    : (nodeCrypto.webcrypto as unknown as Crypto)

const hkdfNoInfo = new ArrayBuffer(0)

// This is a variation of https://github.com/paulmillr/noble-secp256k1/blob/2eb78c9f7b33f514e74a72e4af00ba5d0bcbba20/index.ts#L1554-L1557
// that uses `digest('SHA-256', bytes)` instead of `digest('SHA-256', bytes.buffer)`
// which seems to produce different results.
export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  if (webcrypto.subtle) {
    return new Uint8Array(await webcrypto.subtle.digest('SHA-256', bytes))
  } else if (nodeCrypto) {
    const hash = nodeCrypto.createHash('sha256').update(bytes)
    return Uint8Array.from(hash.digest())
  } else {
    throw new Error("The environment doesn't have sha256 function")
  }
}

export function getRandomValues<T extends ArrayBufferView | null>(array: T): T {
  return webcrypto.getRandomValues(array)
}

// symmetric authenticated encryption of plaintext using the secret;
// additionalData is used to protect un-encrypted parts of the message (header)
// in the authentication scope of the encryption.
export async function encrypt(
  plain: Uint8Array,
  secret: Uint8Array,
  additionalData?: Uint8Array
): Promise<Ciphertext> {
  const salt = getRandomValues(new Uint8Array(KDFSaltSize))
  const nonce = getRandomValues(new Uint8Array(AESGCMNonceSize))

  let encrypted: ArrayBuffer
  if (webcrypto.subtle) {
    const key = await hkdf(secret, salt)
    encrypted = await webcrypto.subtle.encrypt(
      aesGcmParams(nonce, additionalData),
      key,
      plain
    )
  } else if (nodeCrypto) {
    encrypted = await encryptNodeAesGCM(
      aesGcmParams(nonce, additionalData),
      secret,
      Buffer.from(plain)
    )
  } else {
    throw new Error("The environment doesn't have aes-256-gcm encryption")
  }
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
  let decrypted: ArrayBuffer
  if (webcrypto.subtle) {
    const key = await hkdf(secret, encrypted.aes256GcmHkdfSha256.hkdfSalt)
    decrypted = await webcrypto.subtle.decrypt(
      aesGcmParams(encrypted.aes256GcmHkdfSha256.gcmNonce, additionalData),
      key,
      encrypted.aes256GcmHkdfSha256.payload
    )
  } else if (nodeCrypto) {
    decrypted = await decryptNodeAesGCM(
      aesGcmParams(encrypted.aes256GcmHkdfSha256.gcmNonce, additionalData),
      secret,
      Buffer.from(encrypted.aes256GcmHkdfSha256.payload)
    )
  } else {
    throw new Error("The environment doesn't support aes-256-gcm decryption")
  }
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
  const key = await webcrypto.subtle.importKey('raw', secret, 'HKDF', false, [
    'deriveKey',
  ])
  return webcrypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: hkdfNoInfo },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// This is a variation of @peculiar/webcrypto's AES-256-GCM encryption which uses Node crypto
// and is more React Native friendly. https://github.com/PeculiarVentures/webcrypto/blob/7a3f11f3fd7df282084ce377d4be2e3b8b7ac118/src/mechs/aes/crypto.ts#L137-L148
async function encryptNodeAesGCM(
  algorithm: AesGcmParams,
  secret: Uint8Array,
  data: Buffer
) {
  const cipher = nodeCrypto.createCipheriv(
    'aes-256-gcm',
    secret,
    Buffer.from(algorithm.iv as ArrayBuffer),
    {
      authTagLength: (algorithm.tagLength || 128) >> 3,
    }
  )
  if (algorithm.additionalData) {
    cipher.setAAD(Buffer.from(algorithm.additionalData as ArrayBuffer))
  }
  let enc = cipher.update(data)
  enc = Buffer.concat([enc, cipher.final(), cipher.getAuthTag()])
  const res = new Uint8Array(enc).buffer
  return res
}

// This is a variation of @peculiar/webcrypto's AES-256-GCM decryption which uses Node crypto
// and is more React Native friendly. https://github.com/PeculiarVentures/webcrypto/blob/7a3f11f3fd7df282084ce377d4be2e3b8b7ac118/src/mechs/aes/crypto.ts#L150-L161
async function decryptNodeAesGCM(
  algorithm: AesGcmParams,
  secret: Uint8Array,
  data: Buffer
) {
  const decipher = nodeCrypto.createDecipheriv(
    'aes-256-gcm',
    secret,
    new Uint8Array(algorithm.iv as ArrayBuffer)
  )
  const tagLength = (algorithm.tagLength || 128) >> 3
  const enc = data.slice(0, data.length - tagLength)
  const tag = data.slice(data.length - tagLength)
  if (algorithm.additionalData) {
    decipher.setAAD(Buffer.from(algorithm.additionalData as ArrayBuffer))
  }
  decipher.setAuthTag(tag)
  let dec = decipher.update(enc)
  dec = Buffer.concat([dec, decipher.final()])
  return new Uint8Array(dec).buffer
}
