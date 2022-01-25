import _m0 from 'protobufjs/minimal';
export declare const protobufPackage = "";
export interface Signature {
    ecdsaCompact: Signature_ECDSACompact | undefined;
}
export interface Signature_ECDSACompact {
    /** compact representation [ R || S ], 64 bytes */
    bytes: Uint8Array;
    /** recovery bit */
    recovery: number;
}
export interface PublicKey {
    secp256k1Uncompressed: PublicKey_Secp256k1Uncompresed | undefined;
    signature?: Signature | undefined;
}
export interface PublicKey_Secp256k1Uncompresed {
    /** uncompressed point with prefix (0x04) [ P || X || Y ], 65 bytes */
    bytes: Uint8Array;
}
export interface PrivateKey {
    secp256k1: PrivateKey_Secp256k1 | undefined;
}
export interface PrivateKey_Secp256k1 {
    /** D big-endian, 32 bytes */
    bytes: Uint8Array;
}
export interface Ciphertext {
    aes256GcmHkdfSha256: Ciphertext_Aes256gcmHkdfsha256 | undefined;
}
export interface Ciphertext_Aes256gcmHkdfsha256 {
    hkdfSalt: Uint8Array;
    gcmNonce: Uint8Array;
    payload: Uint8Array;
}
export interface PublicKeyBundle {
    identityKey: PublicKey | undefined;
    preKey: PublicKey | undefined;
}
export interface Message {
    header: Message_Header | undefined;
    ciphertext: Ciphertext | undefined;
}
export interface Message_Header {
    sender: PublicKeyBundle | undefined;
    recipient: PublicKeyBundle | undefined;
}
export interface PrivateKeyBundle {
    identityKey: PrivateKey | undefined;
    preKeys: PrivateKey[];
}
export interface EncryptedPrivateKeyBundle {
    walletPreKey: Uint8Array;
    ciphertext: Ciphertext | undefined;
}
export declare const Signature: {
    encode(message: Signature, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): Signature;
    fromJSON(object: any): Signature;
    toJSON(message: Signature): unknown;
    fromPartial<I extends {
        ecdsaCompact?: {
            bytes?: Uint8Array | undefined;
            recovery?: number | undefined;
        } | undefined;
    } & {
        ecdsaCompact?: ({
            bytes?: Uint8Array | undefined;
            recovery?: number | undefined;
        } & {
            bytes?: Uint8Array | undefined;
            recovery?: number | undefined;
        } & Record<Exclude<keyof I["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
    } & Record<Exclude<keyof I, "ecdsaCompact">, never>>(object: I): Signature;
};
export declare const Signature_ECDSACompact: {
    encode(message: Signature_ECDSACompact, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): Signature_ECDSACompact;
    fromJSON(object: any): Signature_ECDSACompact;
    toJSON(message: Signature_ECDSACompact): unknown;
    fromPartial<I extends {
        bytes?: Uint8Array | undefined;
        recovery?: number | undefined;
    } & {
        bytes?: Uint8Array | undefined;
        recovery?: number | undefined;
    } & Record<Exclude<keyof I, keyof Signature_ECDSACompact>, never>>(object: I): Signature_ECDSACompact;
};
export declare const PublicKey: {
    encode(message: PublicKey, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): PublicKey;
    fromJSON(object: any): PublicKey;
    toJSON(message: PublicKey): unknown;
    fromPartial<I extends {
        secp256k1Uncompressed?: {
            bytes?: Uint8Array | undefined;
        } | undefined;
        signature?: {
            ecdsaCompact?: {
                bytes?: Uint8Array | undefined;
                recovery?: number | undefined;
            } | undefined;
        } | undefined;
    } & {
        secp256k1Uncompressed?: ({
            bytes?: Uint8Array | undefined;
        } & {
            bytes?: Uint8Array | undefined;
        } & Record<Exclude<keyof I["secp256k1Uncompressed"], "bytes">, never>) | undefined;
        signature?: ({
            ecdsaCompact?: {
                bytes?: Uint8Array | undefined;
                recovery?: number | undefined;
            } | undefined;
        } & {
            ecdsaCompact?: ({
                bytes?: Uint8Array | undefined;
                recovery?: number | undefined;
            } & {
                bytes?: Uint8Array | undefined;
                recovery?: number | undefined;
            } & Record<Exclude<keyof I["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
        } & Record<Exclude<keyof I["signature"], "ecdsaCompact">, never>) | undefined;
    } & Record<Exclude<keyof I, keyof PublicKey>, never>>(object: I): PublicKey;
};
export declare const PublicKey_Secp256k1Uncompresed: {
    encode(message: PublicKey_Secp256k1Uncompresed, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): PublicKey_Secp256k1Uncompresed;
    fromJSON(object: any): PublicKey_Secp256k1Uncompresed;
    toJSON(message: PublicKey_Secp256k1Uncompresed): unknown;
    fromPartial<I extends {
        bytes?: Uint8Array | undefined;
    } & {
        bytes?: Uint8Array | undefined;
    } & Record<Exclude<keyof I, "bytes">, never>>(object: I): PublicKey_Secp256k1Uncompresed;
};
export declare const PrivateKey: {
    encode(message: PrivateKey, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): PrivateKey;
    fromJSON(object: any): PrivateKey;
    toJSON(message: PrivateKey): unknown;
    fromPartial<I extends {
        secp256k1?: {
            bytes?: Uint8Array | undefined;
        } | undefined;
    } & {
        secp256k1?: ({
            bytes?: Uint8Array | undefined;
        } & {
            bytes?: Uint8Array | undefined;
        } & Record<Exclude<keyof I["secp256k1"], "bytes">, never>) | undefined;
    } & Record<Exclude<keyof I, "secp256k1">, never>>(object: I): PrivateKey;
};
export declare const PrivateKey_Secp256k1: {
    encode(message: PrivateKey_Secp256k1, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): PrivateKey_Secp256k1;
    fromJSON(object: any): PrivateKey_Secp256k1;
    toJSON(message: PrivateKey_Secp256k1): unknown;
    fromPartial<I extends {
        bytes?: Uint8Array | undefined;
    } & {
        bytes?: Uint8Array | undefined;
    } & Record<Exclude<keyof I, "bytes">, never>>(object: I): PrivateKey_Secp256k1;
};
export declare const Ciphertext: {
    encode(message: Ciphertext, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): Ciphertext;
    fromJSON(object: any): Ciphertext;
    toJSON(message: Ciphertext): unknown;
    fromPartial<I extends {
        aes256GcmHkdfSha256?: {
            hkdfSalt?: Uint8Array | undefined;
            gcmNonce?: Uint8Array | undefined;
            payload?: Uint8Array | undefined;
        } | undefined;
    } & {
        aes256GcmHkdfSha256?: ({
            hkdfSalt?: Uint8Array | undefined;
            gcmNonce?: Uint8Array | undefined;
            payload?: Uint8Array | undefined;
        } & {
            hkdfSalt?: Uint8Array | undefined;
            gcmNonce?: Uint8Array | undefined;
            payload?: Uint8Array | undefined;
        } & Record<Exclude<keyof I["aes256GcmHkdfSha256"], keyof Ciphertext_Aes256gcmHkdfsha256>, never>) | undefined;
    } & Record<Exclude<keyof I, "aes256GcmHkdfSha256">, never>>(object: I): Ciphertext;
};
export declare const Ciphertext_Aes256gcmHkdfsha256: {
    encode(message: Ciphertext_Aes256gcmHkdfsha256, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): Ciphertext_Aes256gcmHkdfsha256;
    fromJSON(object: any): Ciphertext_Aes256gcmHkdfsha256;
    toJSON(message: Ciphertext_Aes256gcmHkdfsha256): unknown;
    fromPartial<I extends {
        hkdfSalt?: Uint8Array | undefined;
        gcmNonce?: Uint8Array | undefined;
        payload?: Uint8Array | undefined;
    } & {
        hkdfSalt?: Uint8Array | undefined;
        gcmNonce?: Uint8Array | undefined;
        payload?: Uint8Array | undefined;
    } & Record<Exclude<keyof I, keyof Ciphertext_Aes256gcmHkdfsha256>, never>>(object: I): Ciphertext_Aes256gcmHkdfsha256;
};
export declare const PublicKeyBundle: {
    encode(message: PublicKeyBundle, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): PublicKeyBundle;
    fromJSON(object: any): PublicKeyBundle;
    toJSON(message: PublicKeyBundle): unknown;
    fromPartial<I extends {
        identityKey?: {
            secp256k1Uncompressed?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
            signature?: {
                ecdsaCompact?: {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
        preKey?: {
            secp256k1Uncompressed?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
            signature?: {
                ecdsaCompact?: {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    } & {
        identityKey?: ({
            secp256k1Uncompressed?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
            signature?: {
                ecdsaCompact?: {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } | undefined;
            } | undefined;
        } & {
            secp256k1Uncompressed?: ({
                bytes?: Uint8Array | undefined;
            } & {
                bytes?: Uint8Array | undefined;
            } & Record<Exclude<keyof I["identityKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
            signature?: ({
                ecdsaCompact?: {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } | undefined;
            } & {
                ecdsaCompact?: ({
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } & {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } & Record<Exclude<keyof I["identityKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
            } & Record<Exclude<keyof I["identityKey"]["signature"], "ecdsaCompact">, never>) | undefined;
        } & Record<Exclude<keyof I["identityKey"], keyof PublicKey>, never>) | undefined;
        preKey?: ({
            secp256k1Uncompressed?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
            signature?: {
                ecdsaCompact?: {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } | undefined;
            } | undefined;
        } & {
            secp256k1Uncompressed?: ({
                bytes?: Uint8Array | undefined;
            } & {
                bytes?: Uint8Array | undefined;
            } & Record<Exclude<keyof I["preKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
            signature?: ({
                ecdsaCompact?: {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } | undefined;
            } & {
                ecdsaCompact?: ({
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } & {
                    bytes?: Uint8Array | undefined;
                    recovery?: number | undefined;
                } & Record<Exclude<keyof I["preKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
            } & Record<Exclude<keyof I["preKey"]["signature"], "ecdsaCompact">, never>) | undefined;
        } & Record<Exclude<keyof I["preKey"], keyof PublicKey>, never>) | undefined;
    } & Record<Exclude<keyof I, keyof PublicKeyBundle>, never>>(object: I): PublicKeyBundle;
};
export declare const Message: {
    encode(message: Message, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): Message;
    fromJSON(object: any): Message;
    toJSON(message: Message): unknown;
    fromPartial<I extends {
        header?: {
            sender?: {
                identityKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
                preKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
            recipient?: {
                identityKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
                preKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
        ciphertext?: {
            aes256GcmHkdfSha256?: {
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } | undefined;
        } | undefined;
    } & {
        header?: ({
            sender?: {
                identityKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
                preKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
            recipient?: {
                identityKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
                preKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        } & {
            sender?: ({
                identityKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
                preKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
            } & {
                identityKey?: ({
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } & {
                    secp256k1Uncompressed?: ({
                        bytes?: Uint8Array | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                    } & Record<Exclude<keyof I["header"]["sender"]["identityKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                    signature?: ({
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } & {
                        ecdsaCompact?: ({
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & Record<Exclude<keyof I["header"]["sender"]["identityKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                    } & Record<Exclude<keyof I["header"]["sender"]["identityKey"]["signature"], "ecdsaCompact">, never>) | undefined;
                } & Record<Exclude<keyof I["header"]["sender"]["identityKey"], keyof PublicKey>, never>) | undefined;
                preKey?: ({
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } & {
                    secp256k1Uncompressed?: ({
                        bytes?: Uint8Array | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                    } & Record<Exclude<keyof I["header"]["sender"]["preKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                    signature?: ({
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } & {
                        ecdsaCompact?: ({
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & Record<Exclude<keyof I["header"]["sender"]["preKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                    } & Record<Exclude<keyof I["header"]["sender"]["preKey"]["signature"], "ecdsaCompact">, never>) | undefined;
                } & Record<Exclude<keyof I["header"]["sender"]["preKey"], keyof PublicKey>, never>) | undefined;
            } & Record<Exclude<keyof I["header"]["sender"], keyof PublicKeyBundle>, never>) | undefined;
            recipient?: ({
                identityKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
                preKey?: {
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } | undefined;
            } & {
                identityKey?: ({
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } & {
                    secp256k1Uncompressed?: ({
                        bytes?: Uint8Array | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                    } & Record<Exclude<keyof I["header"]["recipient"]["identityKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                    signature?: ({
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } & {
                        ecdsaCompact?: ({
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & Record<Exclude<keyof I["header"]["recipient"]["identityKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                    } & Record<Exclude<keyof I["header"]["recipient"]["identityKey"]["signature"], "ecdsaCompact">, never>) | undefined;
                } & Record<Exclude<keyof I["header"]["recipient"]["identityKey"], keyof PublicKey>, never>) | undefined;
                preKey?: ({
                    secp256k1Uncompressed?: {
                        bytes?: Uint8Array | undefined;
                    } | undefined;
                    signature?: {
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } | undefined;
                } & {
                    secp256k1Uncompressed?: ({
                        bytes?: Uint8Array | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                    } & Record<Exclude<keyof I["header"]["recipient"]["preKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                    signature?: ({
                        ecdsaCompact?: {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } | undefined;
                    } & {
                        ecdsaCompact?: ({
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & {
                            bytes?: Uint8Array | undefined;
                            recovery?: number | undefined;
                        } & Record<Exclude<keyof I["header"]["recipient"]["preKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                    } & Record<Exclude<keyof I["header"]["recipient"]["preKey"]["signature"], "ecdsaCompact">, never>) | undefined;
                } & Record<Exclude<keyof I["header"]["recipient"]["preKey"], keyof PublicKey>, never>) | undefined;
            } & Record<Exclude<keyof I["header"]["recipient"], keyof PublicKeyBundle>, never>) | undefined;
        } & Record<Exclude<keyof I["header"], keyof Message_Header>, never>) | undefined;
        ciphertext?: ({
            aes256GcmHkdfSha256?: {
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } | undefined;
        } & {
            aes256GcmHkdfSha256?: ({
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } & {
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } & Record<Exclude<keyof I["ciphertext"]["aes256GcmHkdfSha256"], keyof Ciphertext_Aes256gcmHkdfsha256>, never>) | undefined;
        } & Record<Exclude<keyof I["ciphertext"], "aes256GcmHkdfSha256">, never>) | undefined;
    } & Record<Exclude<keyof I, keyof Message>, never>>(object: I): Message;
};
export declare const Message_Header: {
    encode(message: Message_Header, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): Message_Header;
    fromJSON(object: any): Message_Header;
    toJSON(message: Message_Header): unknown;
    fromPartial<I extends {
        sender?: {
            identityKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
            preKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
        recipient?: {
            identityKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
            preKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    } & {
        sender?: ({
            identityKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
            preKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        } & {
            identityKey?: ({
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } & {
                secp256k1Uncompressed?: ({
                    bytes?: Uint8Array | undefined;
                } & {
                    bytes?: Uint8Array | undefined;
                } & Record<Exclude<keyof I["sender"]["identityKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                signature?: ({
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } & {
                    ecdsaCompact?: ({
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & Record<Exclude<keyof I["sender"]["identityKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                } & Record<Exclude<keyof I["sender"]["identityKey"]["signature"], "ecdsaCompact">, never>) | undefined;
            } & Record<Exclude<keyof I["sender"]["identityKey"], keyof PublicKey>, never>) | undefined;
            preKey?: ({
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } & {
                secp256k1Uncompressed?: ({
                    bytes?: Uint8Array | undefined;
                } & {
                    bytes?: Uint8Array | undefined;
                } & Record<Exclude<keyof I["sender"]["preKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                signature?: ({
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } & {
                    ecdsaCompact?: ({
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & Record<Exclude<keyof I["sender"]["preKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                } & Record<Exclude<keyof I["sender"]["preKey"]["signature"], "ecdsaCompact">, never>) | undefined;
            } & Record<Exclude<keyof I["sender"]["preKey"], keyof PublicKey>, never>) | undefined;
        } & Record<Exclude<keyof I["sender"], keyof PublicKeyBundle>, never>) | undefined;
        recipient?: ({
            identityKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
            preKey?: {
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        } & {
            identityKey?: ({
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } & {
                secp256k1Uncompressed?: ({
                    bytes?: Uint8Array | undefined;
                } & {
                    bytes?: Uint8Array | undefined;
                } & Record<Exclude<keyof I["recipient"]["identityKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                signature?: ({
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } & {
                    ecdsaCompact?: ({
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & Record<Exclude<keyof I["recipient"]["identityKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                } & Record<Exclude<keyof I["recipient"]["identityKey"]["signature"], "ecdsaCompact">, never>) | undefined;
            } & Record<Exclude<keyof I["recipient"]["identityKey"], keyof PublicKey>, never>) | undefined;
            preKey?: ({
                secp256k1Uncompressed?: {
                    bytes?: Uint8Array | undefined;
                } | undefined;
                signature?: {
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } | undefined;
            } & {
                secp256k1Uncompressed?: ({
                    bytes?: Uint8Array | undefined;
                } & {
                    bytes?: Uint8Array | undefined;
                } & Record<Exclude<keyof I["recipient"]["preKey"]["secp256k1Uncompressed"], "bytes">, never>) | undefined;
                signature?: ({
                    ecdsaCompact?: {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } | undefined;
                } & {
                    ecdsaCompact?: ({
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & {
                        bytes?: Uint8Array | undefined;
                        recovery?: number | undefined;
                    } & Record<Exclude<keyof I["recipient"]["preKey"]["signature"]["ecdsaCompact"], keyof Signature_ECDSACompact>, never>) | undefined;
                } & Record<Exclude<keyof I["recipient"]["preKey"]["signature"], "ecdsaCompact">, never>) | undefined;
            } & Record<Exclude<keyof I["recipient"]["preKey"], keyof PublicKey>, never>) | undefined;
        } & Record<Exclude<keyof I["recipient"], keyof PublicKeyBundle>, never>) | undefined;
    } & Record<Exclude<keyof I, keyof Message_Header>, never>>(object: I): Message_Header;
};
export declare const PrivateKeyBundle: {
    encode(message: PrivateKeyBundle, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): PrivateKeyBundle;
    fromJSON(object: any): PrivateKeyBundle;
    toJSON(message: PrivateKeyBundle): unknown;
    fromPartial<I extends {
        identityKey?: {
            secp256k1?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
        } | undefined;
        preKeys?: {
            secp256k1?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
        }[] | undefined;
    } & {
        identityKey?: ({
            secp256k1?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
        } & {
            secp256k1?: ({
                bytes?: Uint8Array | undefined;
            } & {
                bytes?: Uint8Array | undefined;
            } & Record<Exclude<keyof I["identityKey"]["secp256k1"], "bytes">, never>) | undefined;
        } & Record<Exclude<keyof I["identityKey"], "secp256k1">, never>) | undefined;
        preKeys?: ({
            secp256k1?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
        }[] & ({
            secp256k1?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
        } & {
            secp256k1?: ({
                bytes?: Uint8Array | undefined;
            } & {
                bytes?: Uint8Array | undefined;
            } & Record<Exclude<keyof I["preKeys"][number]["secp256k1"], "bytes">, never>) | undefined;
        } & Record<Exclude<keyof I["preKeys"][number], "secp256k1">, never>)[] & Record<Exclude<keyof I["preKeys"], keyof {
            secp256k1?: {
                bytes?: Uint8Array | undefined;
            } | undefined;
        }[]>, never>) | undefined;
    } & Record<Exclude<keyof I, keyof PrivateKeyBundle>, never>>(object: I): PrivateKeyBundle;
};
export declare const EncryptedPrivateKeyBundle: {
    encode(message: EncryptedPrivateKeyBundle, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number | undefined): EncryptedPrivateKeyBundle;
    fromJSON(object: any): EncryptedPrivateKeyBundle;
    toJSON(message: EncryptedPrivateKeyBundle): unknown;
    fromPartial<I extends {
        walletPreKey?: Uint8Array | undefined;
        ciphertext?: {
            aes256GcmHkdfSha256?: {
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } | undefined;
        } | undefined;
    } & {
        walletPreKey?: Uint8Array | undefined;
        ciphertext?: ({
            aes256GcmHkdfSha256?: {
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } | undefined;
        } & {
            aes256GcmHkdfSha256?: ({
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } & {
                hkdfSalt?: Uint8Array | undefined;
                gcmNonce?: Uint8Array | undefined;
                payload?: Uint8Array | undefined;
            } & Record<Exclude<keyof I["ciphertext"]["aes256GcmHkdfSha256"], keyof Ciphertext_Aes256gcmHkdfsha256>, never>) | undefined;
        } & Record<Exclude<keyof I["ciphertext"], "aes256GcmHkdfSha256">, never>) | undefined;
    } & Record<Exclude<keyof I, keyof EncryptedPrivateKeyBundle>, never>>(object: I): EncryptedPrivateKeyBundle;
};
declare type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export declare type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
declare type KeysOfUnion<T> = T extends T ? keyof T : never;
export declare type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & Record<Exclude<keyof I, KeysOfUnion<P>>, never>;
export {};
//# sourceMappingURL=message.d.ts.map