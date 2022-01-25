import * as proto from '../../src/proto/message';
import PublicKey from './PublicKey';
export default class Signature implements proto.Signature {
    ecdsaCompact: proto.Signature_ECDSACompact | undefined;
    constructor(obj: proto.Signature);
    getPublicKey(digest: Uint8Array): PublicKey | undefined;
    getEthereumAddress(digest: Uint8Array): string | undefined;
    toBytes(): Uint8Array;
    static fromBytes(bytes: Uint8Array): Signature;
}
//# sourceMappingURL=Signature.d.ts.map