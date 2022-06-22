import { keccak256 } from 'js-sha3'
import { Reader } from 'protobufjs/minimal'

import { PrivateKey } from '../crypto'
import * as proto from '../proto/authReq'

export class AuthRequest {
  public constructor(public proto: proto.ClientAuthRequest) {
    this.proto = proto
  }

  static async createRequest(
    identityKey: PrivateKey,
    peerId: string
  ): Promise<AuthRequest> {
    if (!identityKey.publicKey.signature) {
      throw new Error('no signature')
    }

    const authData = AuthData.createAuthData(
      identityKey.publicKey.walletSignatureAddress(),
      peerId,
      new Date()
    )

    // The authdata struct is encoded to bytes prior to building the request to ensure
    // a consistent byte order when the signature is verified on the receiving side.
    const authDataBytes = authData.encode()
    const digest = await keccak256(authDataBytes)
    const authSig = await identityKey.sign(digest)

    return new AuthRequest({
      v1: {
        identityKeyBytes: identityKey.publicKey.bytesToSign(),
        walletSignature: identityKey.publicKey.signature,
        authDataBytes: authDataBytes,
        authSignature: authSig,
      },
    })
  }

  static decode(bytes: Uint8Array): AuthRequest {
    const res = proto.ClientAuthRequest.decode(Reader.create(bytes))
    return new AuthRequest(res)
  }

  encode(): Uint8Array {
    return proto.ClientAuthRequest.encode(this.proto).finish()
  }
}

export class AuthResponse {
  public constructor(public proto: proto.ClientAuthResponse) {
    this.proto = proto
  }

  static createResponse(
    authSuccessful: boolean,
    errorStr: string
  ): AuthResponse {
    return new AuthResponse({
      v1: {
        authSuccessful: authSuccessful,
        errorStr: errorStr,
      },
    })
  }

  static decode(bytes: Uint8Array): AuthResponse {
    const res = proto.ClientAuthResponse.decode(Reader.create(bytes))
    return new AuthResponse(res)
  }

  encode(): Uint8Array {
    return proto.ClientAuthResponse.encode(this.proto).finish()
  }

  isSuccess(): boolean {
    if (this.proto.v1) {
      return this.proto.v1.authSuccessful
    }

    throw new Error('unsupported response version')
  }

  getErrorStr(): string {
    if (this.proto.v1) {
      return this.proto.v1.authSuccessful ? '' : this.proto.v1.errorStr
    }

    throw new Error('unsupported response version')
  }
}

export class AuthData {
  public constructor(public proto: proto.AuthData) {
    this.proto = proto
  }

  static createAuthData(
    walletAddr: string,
    peerId: string,
    timestamp?: Date
  ): AuthData {
    timestamp = timestamp || new Date()
    return new AuthData({
      walletAddr: walletAddr,
      peerId: peerId,
      timestamp: timestamp.getTime(),
    })
  }

  static decode(bytes: Uint8Array): AuthData {
    const res = proto.AuthData.decode(Reader.create(bytes))
    return new AuthData(res)
  }

  encode(): Uint8Array {
    return proto.AuthData.encode(this.proto).finish()
  }
}
