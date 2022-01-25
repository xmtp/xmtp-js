import * as proto from '../../src/proto/message';
import Signature from './Signature';
import PrivateKey from './PrivateKey';
import * as ethers from 'ethers';
export default class PublicKey implements proto.PublicKey {
    secp256k1Uncompressed: proto.PublicKey_Secp256k1Uncompresed | undefined;
    signature?: Signature | undefined;
    constructor(obj: proto.PublicKey);
    static fromPrivateKey(pri: PrivateKey): PublicKey;
    verify(signature: Signature, digest: Uint8Array): boolean;
    verifyKey(pub: PublicKey): Promise<boolean>;
    signWithWallet(wallet: ethers.Signer): Promise<void>;
    walletSignatureAddress(): string;
    getEthereumAddress(): string;
    equals(other: PublicKey): boolean;
    toBytes(): Uint8Array;
    static fromBytes(bytes: Uint8Array): PublicKey;
}
//# sourceMappingURL=PublicKey.d.ts.map