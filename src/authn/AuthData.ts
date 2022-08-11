import { authn as authnProto } from '@xmtp/proto'

export default class AuthData implements authnProto.AuthData {
  walletAddr: string
  createdNs: number

  public constructor({ walletAddr, createdNs }: authnProto.AuthData) {
    this.walletAddr = walletAddr
    this.createdNs = createdNs
  }

  static create(walletAddr: string, timestamp?: Date): AuthData {
    timestamp = timestamp || new Date()
    return new AuthData({
      walletAddr: walletAddr,
      createdNs: timestamp.getTime() * 1000,
    })
  }

  static fromBytes(bytes: Uint8Array): AuthData {
    const res = authnProto.AuthData.decode(bytes)
    return new AuthData(res)
  }

  toBytes(): Uint8Array {
    return authnProto.AuthData.encode(this).finish()
  }
}
