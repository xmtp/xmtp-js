import { Signer } from 'ethers'
import { Waku } from 'js-waku'
import { PrivateKeyBundle } from '../src'
import Authenticator, { AuthOptions } from '../src/authn/Authenticator'
import { AuthSender } from '../src/authn/AuthSender'
import Client, {
  ClientOptions,
  createWaku,
  defaultOptions,
} from '../src/Client'
import { MockAuthSender } from './authn/helpers'

type TestOptions = {
  authOpts?: AuthOptions
}

export type TestClientOptions = ClientOptions & TestOptions

export class TestClient extends Client {
  constructor(waku: Waku, keys: PrivateKeyBundle, authSender?: AuthSender) {
    super(waku, keys)
    this.authenticator = Authenticator.create(
      this.waku.libp2p,
      this.keys.identityKey,
      { alternativeSender: authSender ?? new MockAuthSender(true) }
    )
  }

  static async create(
    wallet: Signer,
    opts?: Partial<TestClientOptions>
  ): Promise<TestClient> {
    const clientOptions = defaultOptions(opts)

    const waku = await createWaku(clientOptions)
    const keys = await PrivateKeyBundle.generate(wallet)
    const c = new TestClient(waku, keys, opts?.authOpts?.alternativeSender)
    await c.init(clientOptions)
    return c
  }
}
