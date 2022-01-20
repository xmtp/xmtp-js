import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import * as proto from "../../crypto/src/proto/message";
import { TextEncoder, TextDecoder } from 'util';

// crypto should provide access to standard Web Crypto API
// in both the browser environment and node. 
const crypto: Crypto =
    typeof window !== "undefined" ?
        window.crypto :
        require("crypto").webcrypto as unknown as Crypto;

export const AESKeySize = 32; // bytes
export const KDFSaltSize = 32; // bytes
// AES-GCM defaults from https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
export const AESGCMNonceSize = 12; // property iv
export const AESGCMTagLength = 16; // property tagLength

// Signature represents an ECDSA signature with recovery bit.
export class Signature {
    bytes: Uint8Array; // compact format [ R || S ], 64 bytes
    recovery: number; // recovery bit 0 | 1
    constructor(bytes:Uint8Array, recovery: number) {
        if (bytes.length != 64) {
            throw new Error(`invalid signature length: ${bytes.length}`);
        };
        this.bytes = bytes;
        if (recovery !== 0 && recovery !== 1) {
            throw new Error(`invalid recovery bit: ${recovery}`);
        };
        this.recovery = recovery;
    };
    // decode serialized Signature
    static decode(bytes: Uint8Array): Signature {
        let sig = proto.Signature.decode(bytes);
        return Signature.fromDecoded(sig);
    };
    // build Signature from proto.Signature structure
    static fromDecoded(sig: proto.Signature): Signature {
        if (sig.ecdsaCompact) { return new Signature(sig.ecdsaCompact.bytes, sig.ecdsaCompact.recovery) };
        throw new Error("unrecognized signature");
    }
    // If the signature is valid for the provided digest
    // then return the public key that validates it.
    // Otherwise return undefined.
    getPublicKey(digest: Uint8Array): PublicKey | undefined {
        const bytes = secp.recoverPublicKey(digest, this.bytes, this.recovery);
        return bytes ? PublicKey.fromBytes(bytes) : undefined;
    };
    // If the signature is valid for the provided digest
    // return the address derived from te public key that validest it.
    // Otherwise return undefined.
    getEthereumAddress(digest: Uint8Array): string | undefined {
        const pub = this.getPublicKey(digest);
        if (!pub) { return undefined };
        return pub.getEthereumAddress();
     };
     // serialize Signature into bytes
     encode(): Uint8Array {
         return proto.Signature.encode(this.toBeEncoded()).finish()
     }
     // build proto.Signature from Signature
     toBeEncoded(): proto.Signature {
        return {
            ecdsaCompact: {
                bytes: this.bytes,
                recovery: this.recovery
            }
        };
     };
};

// Ciphertext packages the encrypted payload with the salt and nonce used to produce it.
// salt and nonce are not secret, and should be transmitted/stored along with the encrypted payload.
export class Ciphertext {
    payload: Uint8Array; // at least AESGCMTagLength bytes
    salt: Uint8Array; // hkdf salt 
    nonce: Uint8Array; // aes-256-gcm IV
    constructor(payload: Uint8Array, salt: Uint8Array, nonce: Uint8Array) {
        if (payload.length < AESGCMTagLength) {
            throw new Error(`invalid ciphertext payload length: ${payload.length}`);
        };
        if (salt.length != KDFSaltSize) {
            throw new Error(`invalid ciphertext salt length: ${salt.length}`);
        };
        if (nonce.length != AESGCMNonceSize) {
            throw new Error(`invalid ciphertext nonce length: ${nonce.length}`);
        };
        this.payload = payload;
        this.salt = salt;
        this.nonce = nonce;
    };
    // build Ciphertext from proto.Message
    static fromDecoded(message: proto.Message): Ciphertext {
        if (!message.payload) {
            throw new Error("missing message payload");
        }
        if (!message.payload.aes256GcmHkdfSha256) {
            throw new Error("unrecognized message payload");
        };
        const payload = message.payload.aes256GcmHkdfSha256;
        return new Ciphertext(payload.payload, payload.hkdfSalt, payload.gcmNonce);
    }
    // build proto.Message from Ciphertext and the parties' KeyBundles.
    toBeEncoded(sender: KeyBundle, recipient: KeyBundle): proto.Message {
        return {
            header: {
                sender: sender.toBeEncoded(),
                recipient: recipient.toBeEncoded(),
            },
            payload: {
                aes256GcmHkdfSha256: {
                    payload: this.payload,
                    hkdfSalt: this.salt,
                    gcmNonce: this.nonce
                }
            }
        };
    };
};

// PrivateKey represents a secp256k1 private key.
export class PrivateKey {
    bytes: Uint8Array; // 32 bytes of D
    publicKey?: PublicKey; // caches corresponding PublicKey
    constructor (bytes: Uint8Array) {
        if (bytes.length != 32) {
            throw new Error(`invalid private key length: ${bytes.length}`);
        };
        this.bytes = bytes };
    // create a random PrivateKey.
    static generate(): PrivateKey {
        return new PrivateKey(secp.utils.randomPrivateKey());
    };
    // create PrivateKey from 32 bytes of D
    static fromBytes(bytes: Uint8Array): PrivateKey {
        return new PrivateKey(bytes);
    };
    // sign provided digest
    async sign(digest: Uint8Array):Promise<Signature> {
        const [signature, recovery] = await secp.sign(digest, this.bytes, {recovered: true, der: false});
        return new Signature(signature, recovery);
    };
    // sign provided public key
    async signKey(pub: PublicKey):Promise<PublicKey>{
        const digest = await secp.utils.sha256(pub.bytes);
        pub.signature = await this.sign(digest);
        return pub;
    };
    // return corresponding PublicKey
    getPublicKey(): PublicKey {
        if (!this.publicKey) {
            this.publicKey = PublicKey.fromPrivateKey(this);
        };
        return this.publicKey;
    };
    // derive shared secret from peer's PublicKey;
    // the peer can derive the same secret using their PrivateKey and our PublicKey
    sharedSecret(peer: PublicKey): Uint8Array {
        return secp.getSharedSecret(this.bytes, peer.bytes, false);
    };
    // encrypt plain bytes using a shared secret derived from peer's PublicKey;
    // additionalData allows including unencrypted parts of a Message in the authentication
    // protection provided by the encrypted part (to make the whole Message tamper evident)  
    encrypt(plain: Uint8Array, peer: PublicKey, additionalData?: Uint8Array):Promise<Ciphertext> {
        const secret = this.sharedSecret(peer);
        return encrypt(plain, secret, additionalData);
    };
    // decrypt Ciphertext using a shared secret derived from peer's PublicKey;
    // throws if any part of Ciphertext or additionalData was tampered with
    decrypt(encrypted: Ciphertext, peer: PublicKey, additionalData?: Uint8Array): Promise<Uint8Array> {
        const secret = this.sharedSecret(peer);
        return decrypt(encrypted, secret, additionalData);
    };
    // Does the provided PublicKey correspnd to this PrivateKey?
    matches(key: PublicKey): boolean {
        return this.getPublicKey().equals(key);
    }
};

// PublicKey respresents uncompressed secp256k1 public key,
// that can optionally be signed with another trusted key pair.
export class PublicKey {
    bytes: Uint8Array; // uncompressed point [ P || X || Y ], 65 bytes
    signature?: Signature;
    constructor(bytes: Uint8Array, signature?: Signature) {
        if (bytes.length != 65) {
            throw new Error(`invalid public key length: ${bytes.length}`);
        };
        if (bytes[0] != 4) {
            throw new Error(`unrecognized public key prefix: ${bytes[0]}`);
        }
        this.bytes = bytes;
        this.signature = signature;
    };
    // create PublicKey that corresponds to the provided PublicKey
    static fromPrivateKey(pri: PrivateKey): PublicKey {
      return new PublicKey(secp.getPublicKey(pri.bytes));
    };
    // create PublicKey from the raw uncompressed point bytes [ P || X || Y ], 65 bytes
    static fromBytes(bytes: Uint8Array): PublicKey {
        return new PublicKey(bytes);
    }
    // decode serialized PublicKey
    static decode(bytes: Uint8Array): PublicKey {
        return PublicKey.fromDecoded(proto.PublicKey.decode(bytes));
    };
    // build PublicKey from proto.PublicKey
    static fromDecoded(key: proto.PublicKey): PublicKey {
        if (key.secp256k1Uncompressed) {
            if (key.signature) {
                let sig = Signature.fromDecoded(key.signature);
                return new PublicKey(key.secp256k1Uncompressed.bytes, sig);
            } else {
                return new PublicKey(key.secp256k1Uncompressed.bytes);
            };
        };
        throw new Error("unrecognized signature");        
    };
    // verify that Signature was created from provided digest using the corresponding PrivateKey
    verify(signature: Signature, digest: Uint8Array):boolean {
        return secp.verify(signature.bytes, digest, this.bytes);
    }
    // verify that the provided PublicKey was signed by the corresponding PrivateKey
    async verifyKey(pub: PublicKey):Promise<boolean> {
        if (typeof pub.signature === undefined) { return false };
        let digest = await secp.utils.sha256(pub.bytes);
        return pub.signature ? this.verify(pub.signature, digest) : false;
    };
    // derive Ethereum address from this PublicKey
    getEthereumAddress(): string {
        // drop the uncompressed format prefix byte
        const key = this.bytes.slice(1)
        const bytes = keccak_256(key).subarray(-20);
        return "0x"+secp.utils.bytesToHex(bytes);
    };
    // serialize this PublicKey
    encode(): Uint8Array {
        return proto.PublicKey.encode(this.toBeEncoded()).finish()
    }
    // build proto.PublicKey from this PublicKey
    toBeEncoded(): proto.PublicKey {
        let key: proto.PublicKey = { secp256k1Uncompressed: { bytes: this.bytes } };
        if (this.signature) {
            key.signature = this.signature.toBeEncoded()
        }
        return key
    };
    // is other the same/equivalent PublicKey?
    equals(other: PublicKey): boolean {
        for (let i = 0; i < this.bytes.length; i++) {
            if(this.bytes[i] !== other.bytes[i]) {
                return false;
            }
        }
        return true;
    };
};

// Generates a new secp256k1 key pair.
export function generateKeys(): [ PrivateKey, PublicKey ] {
    const pri = PrivateKey.generate();
    return [pri, pri.getPublicKey()]
};

// KeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey can be signed by the wallet to authenticate it.
export class KeyBundle {
    identityKey: PublicKey;
    preKey: PublicKey;
    constructor(identityKey: PublicKey, preKey: PublicKey) {
        this.identityKey = identityKey;
        this.preKey = preKey;
    };
    // protobuf serialization methods
    static decode(bytes: Uint8Array): KeyBundle {
        return KeyBundle.fromDecoded(proto.Message_Participant.decode(bytes));
    };
    static fromDecoded(mp: proto.Message_Participant): KeyBundle {
        if(!mp.identityKey) {
            throw new Error("missing identityKey");
        };
        let identityKey = PublicKey.fromDecoded(mp.identityKey);
        if (!mp.preKey) {
            throw new Error("missing preKey");
        };
        let preKey = PublicKey.fromDecoded(mp.preKey)
        return new KeyBundle(identityKey, preKey);
    }
    encode(): Uint8Array {
        return proto.Message_Participant.encode(this.toBeEncoded()).finish()
    }
    toBeEncoded(): proto.Message_Participant {
        return { 
            identityKey: this.identityKey.toBeEncoded(),
            preKey: this.preKey.toBeEncoded(),
        };
    };
};

// PrivateKeyBundle bundles the private keys corresponding to a KeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.
export class PrivateKeyBundle {
    identityKey: PrivateKey;
    preKey: PrivateKey;
    constructor(identityKey: PrivateKey, preKey: PrivateKey) {
        this.identityKey = identityKey;
        this.preKey = preKey;
    };
    // sharedSecret derives a secret from peer's key bundles using a variation of X3DH protocol
    // where the sender's ephemeral key pair is replaced by the sender's prekey.
    // @recipient indicates whether this is the sending (encrypting) or receiving (decrypting) side.
    async sharedSecret(peer: KeyBundle, recipient: boolean): Promise<Uint8Array> {
        if(! await peer.identityKey.verifyKey(peer.preKey)) {
            throw new Error("peer preKey signature invalid");
        };
        let dh1: Uint8Array, dh2: Uint8Array;
        if (recipient) {
            dh1 = this.preKey.sharedSecret(peer.identityKey);
            dh2 = this.identityKey.sharedSecret(peer.preKey);
        } else {
            dh1 = this.identityKey.sharedSecret(peer.preKey);
            dh2 = this.preKey.sharedSecret(peer.identityKey);
        };
        let dh3 = this.preKey.sharedSecret(peer.preKey);
        let secret = new Uint8Array(dh1.length+dh2.length+dh3.length);
        secret.set(dh1,0);
        secret.set(dh2,dh1.length);
        secret.set(dh3,dh1.length+dh2.length);
        return secret;
    };
    // encrypt the plaintext with a symmetric key derived from the peers' key bundles.
    async encrypt(plain: Uint8Array, recipient: KeyBundle): Promise<Ciphertext> {
        let secret = await this.sharedSecret(recipient, false);
        let ad = associatedData({sender: this.getKeyBundle(), recipient: recipient})
        return encrypt(plain, secret, ad);
    };
    // decrypt the encrypted content using a symmetric key derived from the peers' key bundles.
    async decrypt(encrypted: Ciphertext, sender: KeyBundle): Promise<Uint8Array> {
        let secret = await this.sharedSecret(sender, true);
        let ad = associatedData({sender: sender, recipient: this.getKeyBundle()})
        return decrypt(encrypted, secret, ad);
    };
    // return the corresponding public KeyBundle
    getKeyBundle(): KeyBundle {
        return new KeyBundle(
            this.identityKey.getPublicKey(),
            this.preKey.getPublicKey()
        );
    };
    // encrypt and serialize the message
    async encodeMessage(recipient: KeyBundle, message: string): Promise<Uint8Array> {
        let bytes = new TextEncoder().encode(message);
        let ciphertext = await this.encrypt(bytes, recipient);
        let toBeEncoded = ciphertext.toBeEncoded(this.getKeyBundle(), recipient);
        return proto.Message.encode(toBeEncoded).finish()
    };
    // deserialize and decrypt the message;
    // throws if any part of the messages (including the header) was tampered with
    async decodeMessage(bytes: Uint8Array): Promise<string> {
        let message = proto.Message.decode(bytes);
        if(!message.header) { throw new Error("missing message header")};
        if(!message.header.sender) { throw new Error("missing message sender")};
        if(!message.header.recipient) { throw new Error("missing message recipient")};
        const ciphertext = Ciphertext.fromDecoded(message);
        const sender = KeyBundle.fromDecoded(message.header.sender);
        const recipient = KeyBundle.fromDecoded(message.header.recipient);
        if (!this.preKey.matches(recipient.preKey)) {
            throw new Error("recipient pre-key mismatch");
        }
        bytes = await this.decrypt(ciphertext,sender);
        return new TextDecoder().decode(bytes);
    };
};

// Generate a new key bundle pair with the preKey signed byt the identityKey.
export async function generateBundles(): Promise<[PrivateKeyBundle, KeyBundle]> {
    let [priIdentityKey, pubIdentityKey] = generateKeys();
    let [priPreKey, pubPreKey] = generateKeys();
    await priIdentityKey.signKey(pubPreKey);
    return [
        new PrivateKeyBundle(priIdentityKey, priPreKey),
        new KeyBundle(pubIdentityKey, pubPreKey)
    ];
};

// argument type for associatedData()
interface Header {
    sender: KeyBundle,
    recipient: KeyBundle,
}

// serializes message header into bytes so that it can be included for encryption as associated data
function associatedData(header: Header): Uint8Array {
    return proto.Message_Header.encode({
        sender: header.sender.toBeEncoded(),
        recipient: header.recipient.toBeEncoded(),
    }).finish()
}

const hkdfNoInfo = new ArrayBuffer(0);

// Derive AES-256-GCM key from a shared secret and salt.
// Returns crypto.CryptoKey suitable for the encrypt/decrypt API
async function hkdf(secret: Uint8Array, salt: Uint8Array):Promise<CryptoKey> {
    const key = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        {name: "HKDF", hash: "SHA-256", salt: salt, info: hkdfNoInfo},
        key,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt", "decrypt"]);
};

async function encrypt(plain: Uint8Array, secret: Uint8Array, additionalData?: Uint8Array):Promise<Ciphertext> {
    let salt = crypto.getRandomValues(new Uint8Array(KDFSaltSize));
    let nonce = crypto.getRandomValues(new Uint8Array(AESGCMNonceSize));
    const key = await hkdf(secret, salt);
    const encrypted: ArrayBuffer = await crypto.subtle.encrypt(
        aesGcmParams(nonce, additionalData),
        key,
        plain);
    return new Ciphertext(new Uint8Array(encrypted), salt, nonce);
};

async function decrypt(encrypted: Ciphertext, secret: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array> {
    const key = await hkdf(secret, encrypted.salt);
    const decrypted: ArrayBuffer = await crypto.subtle.decrypt(
        aesGcmParams(encrypted.nonce, additionalData),
        key,
        encrypted.payload);
    return new Uint8Array(decrypted)
};

function aesGcmParams(nonce: Uint8Array, additionalData?: Uint8Array): AesGcmParams {
    let spec: AesGcmParams = {
        name: "AES-GCM",
        iv: nonce };
    if (additionalData) {
        spec.additionalData = additionalData
    };
    return spec;
};

// utility functions
export const getRandomValues = crypto.getRandomValues;
export const bytesToHex = secp.utils.bytesToHex;
export function hexToBytes(s: string): Uint8Array {
    let bytes = new Uint8Array(s.length/2);
    for (let i=0; i<bytes.length; i++) {
      let j = i*2;
      bytes[i] = Number.parseInt(s.slice(j, j+2), 16);
    };
    return bytes;
};
