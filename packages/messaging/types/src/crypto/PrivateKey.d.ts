import * as proto from '../../src/proto/message';
import Signature from './Signature';
import PublicKey from './PublicKey';
import Ciphertext from './Ciphertext';
export default class PrivateKey implements proto.PrivateKey {
    secp256k1: proto.PrivateKey_Secp256k1 | undefined;
    publicKey: PublicKey;
    constructor(obj: proto.PrivateKey);
    static generate(): PrivateKey;
    sign(digest: Uint8Array): Promise<Signature>;
    signKey(pub: PublicKey): Promise<PublicKey>;
    sharedSecret(peer: PublicKey): Uint8Array;
    encrypt(plain: Uint8Array, peer: PublicKey, additionalData?: Uint8Array): Promise<Ciphertext>;
    decrypt(encrypted: Ciphertext, peer: PublicKey, additionalData?: Uint8Array): Promise<Uint8Array>;
    matches(key: PublicKey): boolean;
    toBytes(): Uint8Array;
    static fromBytes(bytes: Uint8Array): PrivateKey;
}
//# sourceMappingURL=PrivateKey.d.ts.map