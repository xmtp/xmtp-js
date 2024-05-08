// This file is taken from `bitchan/eccrypto` and ported to TS. All references to `nodeCrypto` have been replaced with `browserCrypto`
/**
 * `elliptic` is a CommonJS module and has issues with named imports
 * DO NOT CHANGE THIS TO A NAMED IMPORT
 */
import elliptic from 'elliptic'
import crypto from './crypto'

const EC = elliptic.ec
const ec = new EC('secp256k1')

const subtle = crypto.subtle

const EC_GROUP_ORDER = Buffer.from(
  'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
  'hex'
)
const ZERO32 = Buffer.alloc(32, 0)

export type Ecies = {
  iv: Buffer
  ephemeralPublicKey: Buffer
  ciphertext: Buffer
  mac: Buffer
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

function isScalar(x: unknown) {
  return Buffer.isBuffer(x) && x.length === 32
}

function isValidPrivateKey(privateKey: Buffer) {
  if (!isScalar(privateKey)) {
    return false
  }
  return (
    privateKey.compare(ZERO32) > 0 && // > 0
    privateKey.compare(EC_GROUP_ORDER) < 0
  ) // < G
}

// Compare two buffers in constant time to prevent timing attacks.
function equalConstTime(b1: Buffer, b2: Buffer) {
  if (b1.length !== b2.length) {
    return false
  }
  let res = 0
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i] // jshint ignore:line
  }
  return res === 0
}

function randomBytes(size: number): Buffer {
  const arr = new Uint8Array(size)
  crypto.getRandomValues(arr)
  return Buffer.from(arr)
}

async function sha512(msg: Buffer) {
  const digest = await subtle.digest('SHA-512', msg)
  return Buffer.from(digest)
}

function getAes(
  op: 'encrypt' | 'decrypt'
): (iv: Buffer, key: Buffer, data: Buffer) => Promise<Buffer> {
  return function (iv: Buffer, key: Uint8Array, data: Uint8Array) {
    return new Promise(function (resolve) {
      const importAlgorithm = { name: 'AES-CBC' }
      const keyp = subtle.importKey('raw', key, importAlgorithm, false, [op])
      return keyp
        .then(function (cryptoKey) {
          const encAlgorithm = { name: 'AES-CBC', iv }
          return subtle[op](encAlgorithm, cryptoKey, data)
        })
        .then(function (result) {
          resolve(Buffer.from(new Uint8Array(result)))
        })
    })
  }
}

const aesCbcEncrypt = getAes('encrypt')
const aesCbcDecrypt = getAes('decrypt')

export async function hmacSha256Sign(key: Buffer, msg: Buffer) {
  const newKey = await subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  )

  return Buffer.from(
    await subtle.sign({ name: 'HMAC', hash: 'SHA-256' }, newKey, msg)
  )
}

async function hmacSha256Verify(key: Buffer, msg: Buffer, sig: Buffer) {
  const expectedSig = await hmacSha256Sign(key, msg)
  return equalConstTime(expectedSig, sig)
}

/**
 * Generate a new valid private key. Will use the window.crypto or window.msCrypto as source
 * depending on your browser.
 * @returns {Buffer} A 32-byte private key.
 * @function
 */
export function generatePrivate() {
  let privateKey = randomBytes(32)
  while (!isValidPrivateKey(privateKey)) {
    privateKey = randomBytes(32)
  }
  return privateKey
}

export function getPublic(privateKey: Buffer) {
  // This function has sync API so we throw an error immediately.
  assert(privateKey.length === 32, 'Bad private key')
  assert(isValidPrivateKey(privateKey), 'Bad private key')
  // XXX(Kagami): `elliptic.utils.encode` returns array for every
  // encoding except `hex`.
  return Buffer.from(ec.keyFromPrivate(privateKey).getPublic('array'))
}

/**
 * Get compressed version of public key.
 */
export function getPublicCompressed(privateKey: Buffer) {
  // jshint ignore:line
  assert(privateKey.length === 32, 'Bad private key')
  assert(isValidPrivateKey(privateKey), 'Bad private key')
  // See https://github.com/wanderer/secp256k1-node/issues/46
  const compressed = true
  return Buffer.from(
    ec.keyFromPrivate(privateKey).getPublic(compressed, 'array')
  )
}

// NOTE(Kagami): We don't use promise shim in Browser implementation
// because it's supported natively in new browsers (see
// <http://caniuse.com/#feat=promises>) and we can use only new browsers
// because of the WebCryptoAPI (see
// <http://caniuse.com/#feat=cryptography>).
export function sign(privateKey: Buffer, msg: Buffer) {
  return new Promise(function (resolve) {
    assert(privateKey.length === 32, 'Bad private key')
    assert(isValidPrivateKey(privateKey), 'Bad private key')
    assert(msg.length > 0, 'Message should not be empty')
    assert(msg.length <= 32, 'Message is too long')
    resolve(Buffer.from(ec.sign(msg, privateKey, { canonical: true }).toDER()))
  })
}

export function verify(publicKey: Buffer, msg: Buffer, sig: Buffer) {
  return new Promise(function (resolve, reject) {
    assert(publicKey.length === 65 || publicKey.length === 33, 'Bad public key')
    if (publicKey.length === 65) {
      assert(publicKey[0] === 4, 'Bad public key')
    }
    if (publicKey.length === 33) {
      assert(publicKey[0] === 2 || publicKey[0] === 3, 'Bad public key')
    }
    assert(msg.length > 0, 'Message should not be empty')
    assert(msg.length <= 32, 'Message is too long')
    if (ec.verify(msg, sig, publicKey)) {
      resolve(null)
    } else {
      reject(new Error('Bad signature'))
    }
  })
}

export function derive(
  privateKeyA: Buffer,
  publicKeyB: Buffer
): Promise<Buffer> {
  return new Promise(function (resolve) {
    assert(Buffer.isBuffer(privateKeyA), 'Bad private key')
    assert(Buffer.isBuffer(publicKeyB), 'Bad public key')
    assert(privateKeyA.length === 32, 'Bad private key')
    assert(isValidPrivateKey(privateKeyA), 'Bad private key')
    assert(
      publicKeyB.length === 65 || publicKeyB.length === 33,
      'Bad public key'
    )
    if (publicKeyB.length === 65) {
      assert(publicKeyB[0] === 4, 'Bad public key')
    }
    if (publicKeyB.length === 33) {
      assert(publicKeyB[0] === 2 || publicKeyB[0] === 3, 'Bad public key')
    }
    const keyA = ec.keyFromPrivate(privateKeyA)
    const keyB = ec.keyFromPublic(publicKeyB)
    const Px = keyA.derive(keyB.getPublic()) // BN instance
    resolve(Buffer.from(Px.toArray()))
  })
}

export async function encrypt(
  publicKeyTo: Buffer,
  msg: Buffer,
  opts?: { ephemPrivateKey?: Buffer; iv?: Buffer } | undefined
) {
  opts = opts || {}
  // Take IV from opts or generate randomly
  const iv = opts?.iv || randomBytes(16)
  let ephemPrivateKey = opts?.ephemPrivateKey || randomBytes(32)
  // There is a very unlikely possibility that it is not a valid key
  while (!isValidPrivateKey(ephemPrivateKey)) {
    if (opts?.ephemPrivateKey) {
      throw new Error('ephemPrivateKey is not valid')
    }
    ephemPrivateKey = randomBytes(32)
  }
  // Get the public key from the ephemeral private key
  const ephemeralPublicKey = getPublic(ephemPrivateKey)

  const hash = await sha512(await derive(ephemPrivateKey, publicKeyTo))
  const encryptionKey = hash.slice(0, 32)
  const macKey = hash.slice(32)
  const ciphertext = await aesCbcEncrypt(iv, encryptionKey, msg)

  // Get a MAC
  const dataToMac = Buffer.concat([iv, ephemeralPublicKey, ciphertext])
  const mac = await hmacSha256Sign(macKey, dataToMac)

  // Return the payload
  return {
    iv,
    ephemeralPublicKey,
    ciphertext,
    mac,
  }
}

export async function decrypt(privateKey: Buffer, opts: Ecies) {
  const px = await derive(privateKey, opts.ephemeralPublicKey)
  const hash = await sha512(px)
  const encryptionKey = hash.slice(0, 32)
  const macKey = hash.slice(32)
  const dataToMac = Buffer.concat([
    opts.iv,
    opts.ephemeralPublicKey,
    opts.ciphertext,
  ])
  assert(await hmacSha256Verify(macKey, dataToMac, opts.mac), 'Bad mac')

  return aesCbcDecrypt(opts.iv, encryptionKey, opts.ciphertext)
}
