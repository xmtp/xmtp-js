import * as secp from "@noble/secp256k1";
import { webcrypto as crypto } from "crypto";

export const AESKeySize = 32;
export const KDFSaltSize = 32;
export const AESGCMNonceSize = 12;

export class Signature {
    bytes: Uint8Array; // uncompressed signature [ R || S ]
    recovery: number; // recovery bit
    constructor(bytes:Uint8Array, recovery: number) {
        this.bytes = bytes;
        this.recovery = recovery;
    }
}

export class PrivateKey {
    bytes: Uint8Array;
    constructor (bytes: Uint8Array) { this.bytes = bytes };
    static generate(): PrivateKey {
        return new PrivateKey(secp.utils.randomPrivateKey())
    };
    static fromBytes(bytes: Uint8Array): PrivateKey {
        return new PrivateKey(bytes)
    };
    sign(digest: Uint8Array):Promise<Signature> {
        return secp.sign(digest, this.bytes, {recovered: true})
          .then(([signature, recovery]) => new Signature(signature, recovery))
    }
    signKey(pub: PublicKey):Promise<PublicKey>{
        return secp.utils.sha256(pub.bytes)
            .then(digest => this.sign(digest))
            .then(signature => {
                pub.signature = signature;
                return pub })
    }
    sharedSecret(peer: PublicKey): Uint8Array {
        return secp.getSharedSecret(this.bytes, peer.bytes, false)
    }
    encrypt(plain: Uint8Array, peer: PublicKey, additionalData?: Uint8Array):Promise<[Uint8Array,Uint8Array,Uint8Array]> {
        const secret = this.sharedSecret(peer)
        return encrypt(plain, secret, additionalData)
    }
    decrypt(encrypted: Uint8Array, peer: PublicKey, salt: Uint8Array, nonce: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array> {
        const secret = this.sharedSecret(peer)
        return decrypt(encrypted, secret, salt, nonce, additionalData)
    }
}

export class PublicKey {
    bytes: Uint8Array; // uncompressed point 
    signature?: Signature;
    constructor(bytes: Uint8Array, signature?: Signature) {
        this.bytes = bytes;
        this.signature = signature
    }
    static fromPrivateKey(pri: PrivateKey): PublicKey {
      return new PublicKey(secp.getPublicKey(pri.bytes))
    };
    static fromBytes(bytes: Uint8Array): PublicKey {
        return new PublicKey(bytes)
    }
    verify(signature: Signature, digest: Uint8Array):boolean {
        return secp.verify(signature.bytes, digest, this.bytes)
    }
    verifyKey(pub: PublicKey):Promise<boolean> {
        if (typeof pub.signature === undefined) { return Promise.resolve(false) };
        return secp.utils.sha256(pub.bytes)
            .then(digest => this.verify(pub.signature, digest))
    }
}

export function generateKeys(): [PrivateKey, PublicKey] {
    const pri = PrivateKey.generate();
    const pub = PublicKey.fromPrivateKey(pri);
    return [pri, pub]
}

const emptyBuffer = new ArrayBuffer(0)

// Derive AES-256-GCM key from a shared secret and salt.
// Returns crypto.CryptoKey suitable for the encrypt/decrypt API
function hkdf(secret: Uint8Array, salt: Uint8Array):Promise<crypto.subtle.CryptoKey> {
    return crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"])
    .then(key => crypto.subtle.deriveKey(
            {name: "HKDF", hash: "SHA-256", salt: salt, info: emptyBuffer},
            key,
            {name: "AES-GCM", length: 256},
            false,
            ["encrypt", "decrypt"]) )
}

function encrypt(plain: Uint8Array, secret: Uint8Array, additionalData?: Uint8Array):Promise<[Uint8Array,Uint8Array,Uint8Array]> {
    var salt = new Uint8Array(KDFSaltSize);
    crypto.getRandomValues(salt);
    var nonce = new Uint8Array(AESGCMNonceSize);
    crypto.getRandomValues(nonce);
    return hkdf(secret, salt)
        .then(key => {
            var spec = {
                name: "AES-GCM",
                iv: nonce };
            if (additionalData) {
                spec.additionalData = additionalData
            }
            return crypto.subtle.encrypt(spec, key, plain)})
        .then( encrypted => [ encrypted, salt, nonce ])
}

function decrypt(encrypted: Uint8Array, secret: Uint8Array, salt: Uint8Array, nonce: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array> {
    return hkdf(secret, salt)
        .then(key => {
            var spec = {
                name: "AES-GCM",
                iv: nonce
            };
            if (additionalData) {
                spec.additionalData = additionalData
            };
            return crypto.subtle.decrypt(spec, key, encrypted)
        })
}