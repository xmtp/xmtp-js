import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";

// crypto should provide access to standard Web Crypto API
// in both the browser environment and node. 
const crypto: Crypto =
    typeof window !== "undefined" ?
        window.crypto :
        require("crypto").webcrypto as unknown as Crypto;

export const AESKeySize = 32;
export const KDFSaltSize = 32;
export const AESGCMNonceSize = 12;

export class Signature {
    bytes: Uint8Array; // uncompressed signature [ R || S ]
    recovery: number; // recovery bit
    constructor(bytes:Uint8Array, recovery: number) {
        this.bytes = bytes;
        this.recovery = recovery;
    };
    getPublicKey(digest: Uint8Array): PublicKey | undefined {
        const bytes = secp.recoverPublicKey(digest, this.bytes, this.recovery);
        return bytes ? PublicKey.fromBytes(bytes) : undefined;
    };
    getEthereumAddress(digest: Uint8Array): string | undefined {
        const pub = this.getPublicKey(digest);
        if (!pub) { return undefined };
        return pub.getEthereumAddress();
     };
};

// Ciphertext packages the encrypted payload with the salt and nonce used to produce it.
// salt and nonce are secret.
export class Ciphertext {
    payload: Uint8Array; 
    salt: Uint8Array; // hkdf salt 
    nonce: Uint8Array; // aes-256-gcm IV
    constructor(payload: Uint8Array, salt: Uint8Array, nonce: Uint8Array) {
        this.payload = payload;
        this.salt = salt;
        this.nonce = nonce;
    };
};

export class PrivateKey {
    bytes: Uint8Array;
    constructor (bytes: Uint8Array) { this.bytes = bytes };
    static generate(): PrivateKey {
        return new PrivateKey(secp.utils.randomPrivateKey());
    };
    static fromBytes(bytes: Uint8Array): PrivateKey {
        return new PrivateKey(bytes);
    };
    async sign(digest: Uint8Array):Promise<Signature> {
        const [signature, recovery] = await secp.sign(digest, this.bytes, {recovered: true});
        return new Signature(signature, recovery);
    };
    async signKey(pub: PublicKey):Promise<PublicKey>{
        const digest = await secp.utils.sha256(pub.bytes);
        pub.signature = await this.sign(digest);
        return pub;
    };
    getPublicKey(): PublicKey {
        return PublicKey.fromPrivateKey(this);
    };
    sharedSecret(peer: PublicKey): Uint8Array {
        return secp.getSharedSecret(this.bytes, peer.bytes, false);
    };
    encrypt(plain: Uint8Array, peer: PublicKey, additionalData?: Uint8Array):Promise<Ciphertext> {
        const secret = this.sharedSecret(peer);
        return encrypt(plain, secret, additionalData);
    };
    decrypt(encrypted: Ciphertext, peer: PublicKey, additionalData?: Uint8Array): Promise<Uint8Array> {
        const secret = this.sharedSecret(peer);
        return decrypt(encrypted, secret, additionalData);
    };
};

export class PublicKey {
    bytes: Uint8Array; // uncompressed point 
    signature?: Signature;
    constructor(bytes: Uint8Array, signature?: Signature) {
        this.bytes = bytes;
        this.signature = signature;
    };
    static fromPrivateKey(pri: PrivateKey): PublicKey {
      return new PublicKey(secp.getPublicKey(pri.bytes));
    };
    static fromBytes(bytes: Uint8Array): PublicKey {
        return new PublicKey(bytes);
    }
    verify(signature: Signature, digest: Uint8Array):boolean {
        return secp.verify(signature.bytes, digest, this.bytes);
    }
    async verifyKey(pub: PublicKey):Promise<boolean> {
        if (typeof pub.signature === undefined) { return false };
        var digest = await secp.utils.sha256(pub.bytes);
        return pub.signature ? this.verify(pub.signature, digest) : false;
    };
    getEthereumAddress(): string {
        const bytes = keccak_256(this.bytes).subarray(-20);
        return "0x"+secp.utils.bytesToHex(bytes);
    };
};

export function generateKeys(): [PrivateKey, PublicKey] {
    const pri = PrivateKey.generate();
    const pub = PublicKey.fromPrivateKey(pri);
    return [pri, pub];
};

const emptyBuffer = new ArrayBuffer(0);

// Derive AES-256-GCM key from a shared secret and salt.
// Returns crypto.CryptoKey suitable for the encrypt/decrypt API
async function hkdf(secret: Uint8Array, salt: Uint8Array):Promise<CryptoKey> {
    const key = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        {name: "HKDF", hash: "SHA-256", salt: salt, info: emptyBuffer},
        key,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt", "decrypt"]);
};

async function encrypt(plain: Uint8Array, secret: Uint8Array, additionalData?: Uint8Array):Promise<Ciphertext> {
    var salt = new Uint8Array(KDFSaltSize);
    crypto.getRandomValues(salt);
    var nonce = new Uint8Array(AESGCMNonceSize);
    crypto.getRandomValues(nonce);
    const key = await hkdf(secret, salt);
    const encrypted = await crypto.subtle.encrypt(aesGcmParams(nonce, additionalData), key, plain);
    return new Ciphertext(encrypted, salt, nonce);
};

async function decrypt(encrypted: Ciphertext, secret: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array> {
    const key = await hkdf(secret, encrypted.salt);
    return crypto.subtle.decrypt(aesGcmParams(encrypted.nonce, additionalData), key, encrypted.payload);
};

function aesGcmParams(nonce: Uint8Array, additionalData?: Uint8Array): AesGcmParams {
    var spec: AesGcmParams = {
        name: "AES-GCM",
        iv: nonce
    };
    if (additionalData) {
        spec.additionalData = additionalData
    };
    return spec;
};

export const getRandomValues = crypto.getRandomValues;
export const bytesToHex = secp.utils.bytesToHex;
export function hexToBytes(s: string): Uint8Array {
    let bytes = new Uint8Array(s.length/2);
    for(let i=0; i<bytes.length; i++) {
      let j = i*2;
      bytes[i]=Number.parseInt(s.slice(j, j+2), 16);
    };
    return bytes;
};