import * as proto from '../../src/proto/message';
import PrivateKey from './PrivateKey';
import PublicKeyBundle from './PublicKeyBundle';
import * as ethers from 'ethers';
export default class PrivateKeyBundle implements proto.PrivateKeyBundle {
    identityKey: PrivateKey | undefined;
    preKeys: PrivateKey[];
    preKey: PrivateKey;
    publicKeyBundle: PublicKeyBundle;
    constructor(identityKey: PrivateKey, preKey: PrivateKey);
    static generate(): Promise<PrivateKeyBundle>;
    sharedSecret(peer: PublicKeyBundle, recipient: boolean): Promise<Uint8Array>;
    encode(wallet: ethers.Signer): Promise<Uint8Array>;
    static decode(wallet: ethers.Signer, bytes: Uint8Array): Promise<PrivateKeyBundle>;
}
//# sourceMappingURL=PrivateKeyBundle.d.ts.map