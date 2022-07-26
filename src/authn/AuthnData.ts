import { Reader } from 'protobufjs/minimal'

import * as proto from '../proto/authn'

export class AuthnData {
  public constructor(public proto: proto.AuthnData) {
    this.proto = proto
  }

  static create(
    walletAddr: string,
    peerId: string,
    timestamp?: Date
  ): AuthnData {
    timestamp = timestamp || new Date()
    return new AuthnData({
      walletAddr: walletAddr,
      peerId: peerId,
      timestamp: timestamp.getTime(),
    })
  }

  static decode(bytes: Uint8Array): AuthnData {
    const res = proto.AuthnData.decode(Reader.create(bytes))
    return new AuthnData(res)
  }

  encode(): Uint8Array {
    return proto.AuthnData.encode(this.proto).finish()
  }
}
