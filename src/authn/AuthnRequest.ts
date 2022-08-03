// Commenting out this package until we have support for authn in GRPC
// import { keccak256 } from 'js-sha3'
// import { Reader } from 'protobufjs/minimal'

// import { PrivateKey } from '../crypto'
// import { hexToBytes } from '../crypto/utils'
// import * as proto from '../proto/authn'
// import { AuthnData } from './AuthnData'

// export class AuthnRequest {
//   public constructor(public proto: proto.ClientAuthnRequest) {
//     this.proto = proto
//   }

//   static async create(
//     identityKey: PrivateKey,
//     peerId: string
//   ): Promise<AuthnRequest> {
//     if (!identityKey.publicKey.signature) {
//       throw new Error('no signature')
//     }

//     const authnData = AuthnData.create(
//       identityKey.publicKey.walletSignatureAddress(),
//       peerId,
//       new Date()
//     )

//     // The authnData struct is encoded to bytes prior to building the request to ensure
//     // a consistent byte order when the signature is verified on the receiving side.
//     const authnDataBytes = authnData.encode()
//     const digest = await keccak256(authnDataBytes)
//     const authnSig = await identityKey.sign(hexToBytes(digest))

//     return new AuthnRequest({
//       v1: {
//         identityKeyBytes: identityKey.publicKey.bytesToSign(),
//         walletSignature: identityKey.publicKey.signature,
//         authnDataBytes: authnDataBytes,
//         authnSignature: authnSig,
//       },
//     })
//   }

//   static decode(bytes: Uint8Array): AuthnRequest {
//     const res = proto.ClientAuthnRequest.decode(Reader.create(bytes))
//     return new AuthnRequest(res)
//   }

//   encode(): Uint8Array {
//     return proto.ClientAuthnRequest.encode(this.proto).finish()
//   }
// }
