import * as secp from '@noble/secp256k1';
import KeyBundle from './KeyBundle';
import PrivateKeyBundle from './PrivateKeyBundle';
import Ciphertext, { AESGCMNonceSize, KDFSaltSize } from './Ciphertext';
import PrivateKey from './PrivateKey';
import PublicKey from './PublicKey';

// crypto should provide access to standard Web Crypto API
// in both the browser environment and node.
const crypto: Crypto =
  typeof window !== 'undefined'
    ? window.crypto
    : // eslint-disable-next-line @typescript-eslint/no-var-requires
      (require('crypto').webcrypto as unknown as Crypto);

// Generate a new key bundle pair with the preKey signed byt the identityKey.
export async function generateBundles(): Promise<
  [PrivateKeyBundle, KeyBundle]
> {
  const [priIdentityKey, pubIdentityKey] = generateKeys();
  const [priPreKey, pubPreKey] = generateKeys();
  await priIdentityKey.signKey(pubPreKey);
  return [
    new PrivateKeyBundle(priIdentityKey, priPreKey),
    new KeyBundle(pubIdentityKey, pubPreKey)
  ];
}

// Generates a new secp256k1 key pair.
export function generateKeys(): [PrivateKey, PublicKey] {
  const pri = PrivateKey.generate();
  return [pri, pri.getPublicKey()];
}

export async function encrypt(
  plain: Uint8Array,
  secret: Uint8Array,
  additionalData?: Uint8Array
): Promise<Ciphertext> {
  const salt = crypto.getRandomValues(new Uint8Array(KDFSaltSize));
  const nonce = crypto.getRandomValues(new Uint8Array(AESGCMNonceSize));
  const key = await hkdf(secret, salt);
  const encrypted: ArrayBuffer = await crypto.subtle.encrypt(
    aesGcmParams(nonce, additionalData),
    key,
    plain
  );
  return new Ciphertext(new Uint8Array(encrypted), salt, nonce);
}

export async function decrypt(
  encrypted: Ciphertext,
  secret: Uint8Array,
  additionalData?: Uint8Array
): Promise<Uint8Array> {
  const key = await hkdf(secret, encrypted.salt);
  const decrypted: ArrayBuffer = await crypto.subtle.decrypt(
    aesGcmParams(encrypted.nonce, additionalData),
    key,
    encrypted.payload
  );
  return new Uint8Array(decrypted);
}

function aesGcmParams(
  nonce: Uint8Array,
  additionalData?: Uint8Array
): AesGcmParams {
  const spec: AesGcmParams = {
    name: 'AES-GCM',
    iv: nonce
  };
  if (additionalData) {
    spec.additionalData = additionalData;
  }
  return spec;
}

export const getRandomValues = crypto.getRandomValues;

export const bytesToHex = secp.utils.bytesToHex;

export function hexToBytes(s: string): Uint8Array {
  if (s.startsWith('0x')) {
    s = s.slice(2);
  }
  const bytes = new Uint8Array(s.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const j = i * 2;
    bytes[i] = Number.parseInt(s.slice(j, j + 2), 16);
  }
  return bytes;
}
export function equalBytes(b1: Uint8Array, b2: Uint8Array): boolean {
  if (b1.length !== b2.length) {
    return false;
  }
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) {
      return false;
    }
  }
  return true;
}

const hkdfNoInfo = new ArrayBuffer(0);

// Derive AES-256-GCM key from a shared secret and salt.
// Returns crypto.CryptoKey suitable for the encrypt/decrypt API
async function hkdf(secret: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey('raw', secret, 'HKDF', false, [
    'deriveKey'
  ]);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: hkdfNoInfo },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
