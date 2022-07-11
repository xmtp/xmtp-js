import { keccak256 } from 'js-sha3'
import { Reader } from 'protobufjs/minimal'

import { PrivateKey } from '../crypto'
import * as proto from '../proto/authn'
import { AuthnData } from './AuthnData'

export class AuthnRequest {
  public constructor(public proto: proto.ClientAuthRequest) {
    this.proto = proto
  }

  static async createRequest(
    identityKey: PrivateKey,
    peerId: string
  ): Promise<AuthnRequest> {
    if (!identityKey.publicKey.signature) {
      throw new Error('no signature')
    }

    const authData = AuthnData.createAuthData(
      identityKey.publicKey.walletSignatureAddress(),
      peerId,
      new Date()
    )

    // The authdata struct is encoded to bytes prior to building the request to ensure
    // a consistent byte order when the signature is verified on the receiving side.
    const authDataBytes = authData.encode()
    const digest = await keccak256(authDataBytes)
    const authSig = await identityKey.sign(digest)

    return new AuthnRequest({
      v1: {
        identityKeyBytes: identityKey.publicKey.bytesToSign(),
        walletSignature: identityKey.publicKey.signature,
        authDataBytes: authDataBytes,
        authSignature: authSig,
      },
    })
  }

  static decode(bytes: Uint8Array): AuthnRequest {
    const res = proto.ClientAuthRequest.decode(Reader.create(bytes))
    return new AuthnRequest(res)
  }

  encode(): Uint8Array {
    return proto.ClientAuthRequest.encode(this.proto).finish()
  }
}
