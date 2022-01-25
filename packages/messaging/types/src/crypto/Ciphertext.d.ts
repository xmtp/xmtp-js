import * as proto from '../proto/message';
export declare const AESKeySize = 32;
export declare const KDFSaltSize = 32;
export declare const AESGCMNonceSize = 12;
export declare const AESGCMTagLength = 16;
export default class Ciphertext implements proto.Ciphertext {
    aes256GcmHkdfSha256: proto.Ciphertext_Aes256gcmHkdfsha256 | undefined;
    constructor(obj: proto.Ciphertext);
    toBytes(): Uint8Array;
    static fromBytes(bytes: Uint8Array): Ciphertext;
}
//# sourceMappingURL=Ciphertext.d.ts.map