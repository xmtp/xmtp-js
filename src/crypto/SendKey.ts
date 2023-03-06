import { publicKey as proto } from '@xmtp/proto'
import { SignedPublicKeyV2 } from './PublicKey'

// PrivateKeyBundle bundles the private keys corresponding to a PublicKeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.
export class SendKey implements proto.SendKey {
  v1: proto.SendKey_SendKeyV1 | undefined
  private _signedPublicKey: SignedPublicKeyV2

  constructor(sendKey: proto.SendKey) {
    const signedPublicKey = sendKey?.v1?.signedPublicKey
    if (!signedPublicKey) {
      throw new Error('send key proto is missing data')
    }
    this._signedPublicKey = new SignedPublicKeyV2(signedPublicKey)
  }

  public get signedPublicKey() {
    return this._signedPublicKey
  }

  encode(): Uint8Array {
    return proto.SendKey.encode({ v1: this.v1 }).finish()
  }
}
