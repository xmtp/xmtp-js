import * as secp from "@noble/secp256k1";

export class Signature {
    bytes: Uint8Array;
    recovery: number;
    constructor(bytes:Uint8Array, recovery: number) {
        this.bytes = bytes;
        this.recovery = recovery;
    }
}

export class PrivateKey {
    bytes: Uint8Array;
    constructor () {
        this.bytes = secp.utils.randomPrivateKey()
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
}

export class PublicKey {
    bytes: Uint8Array;
    signature?: Signature;
    constructor (pri: PrivateKey) {
        this.bytes = secp.getPublicKey(pri.bytes)
    };
    verify(signature: Signature, digest: Uint8Array):boolean {
        return secp.verify(signature.bytes, digest, this.bytes)
    }
    verifyKey(pub: PublicKey):Promise<boolean> {
        return pub.signature === undefined ?
            Promise.resolve(false) :
            secp.utils.sha256(pub.bytes)
                .then(digest => this.verify(pub.signature, digest))
    }
}

export function generateKeys(): [PrivateKey, PublicKey] {
    const pri = new PrivateKey();
    const pub = new PublicKey(pri);
    return [pri, pub]
}
