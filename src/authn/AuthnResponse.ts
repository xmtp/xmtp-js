import { Reader } from 'protobufjs/minimal'

import * as proto from '../proto/authn'

export class AuthnResponse {
  public constructor(public proto: proto.ClientAuthResponse) {
    this.proto = proto
  }

  static create(authSuccessful: boolean, errorStr: string): AuthnResponse {
    return new AuthnResponse({
      v1: {
        authSuccessful: authSuccessful,
        errorStr: errorStr,
      },
    })
  }

  static decode(bytes: Uint8Array): AuthnResponse {
    const res = proto.ClientAuthResponse.decode(Reader.create(bytes))
    return new AuthnResponse(res)
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
