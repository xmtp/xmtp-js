import type { authn } from '@xmtp/proto'
import type {
  KeystoreInterface,
  KeystoreInterfaces,
} from '@/keystore/rpcDefinitions'
import { dateToNs } from '@/utils/date'
import Token from './Token'

const wrapToken = (token: authn.Token): Token => {
  if (token instanceof Token) {
    return token
  }
  return new Token(token)
}

export default class KeystoreAuthenticator<
  T extends KeystoreInterfaces = KeystoreInterface,
> {
  private keystore: T

  constructor(keystore: T) {
    this.keystore = keystore
  }

  async createToken(timestamp?: Date): Promise<Token> {
    const token = await this.keystore.createAuthToken({
      timestampNs: timestamp ? dateToNs(timestamp) : undefined,
    })

    return wrapToken(token)
  }
}
