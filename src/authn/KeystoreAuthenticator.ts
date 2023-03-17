import { authn } from '@xmtp/proto'
import { Keystore } from '../keystore'
import { dateToNs } from '../utils'
import Token from './Token'

const wrapToken = (token: authn.Token): Token => {
  if (token instanceof Token) {
    return token
  }
  return new Token(token)
}

export default class KeystoreAuthenticator {
  private keystore: Keystore

  constructor(keystore: Keystore) {
    this.keystore = keystore
  }

  async createToken(timestamp?: Date): Promise<Token> {
    const token = await this.keystore.createAuthToken({
      timestampNs: timestamp ? dateToNs(timestamp) : undefined,
    })

    return wrapToken(token)
  }
}
