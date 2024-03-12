import { authn as authnProto } from '@xmtp/proto'
import type Long from 'long'
import { dateToNs } from '@/utils/date'

export default class AuthData implements authnProto.AuthData {
  walletAddr: string
  createdNs: Long

  public constructor({ walletAddr, createdNs }: authnProto.AuthData) {
    this.walletAddr = walletAddr
    this.createdNs = createdNs
  }

  static create(walletAddr: string, timestamp?: Date): AuthData {
    timestamp = timestamp || new Date()
    return new AuthData({
      walletAddr,
      createdNs: dateToNs(timestamp),
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
