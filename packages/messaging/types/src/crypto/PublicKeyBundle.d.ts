import * as proto from '../../src/proto/message';
import PublicKey from './PublicKey';
export default class PublicKeyBundle implements proto.PublicKeyBundle {
    identityKey: PublicKey | undefined;
    preKey: PublicKey | undefined;
    constructor(identityKey: PublicKey | undefined, preKey: PublicKey | undefined);
    toBytes(): Uint8Array;
    static fromBytes(bytes: Uint8Array): PublicKeyBundle;
}
//# sourceMappingURL=PublicKeyBundle.d.ts.map