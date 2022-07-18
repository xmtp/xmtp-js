import { Signer } from 'ethers'
import { Waku } from 'js-waku'
import { PrivateKeyBundle } from '../src'
import { Authenticator, AuthnOptions, AuthnSender } from '../src/authn'

import Client, {
  ClientOptions,
  createWaku,
  defaultOptions,
} from '../src/Client'
import { MockAuthnSender } from './authn/helpers'

type TestOptions = {
  authOpts?: AuthnOptions
}

export type TestClientOptions = ClientOptions & TestOptions

export class TestClient extends Client {
  constructor(waku: Waku, keys: PrivateKeyBundle, authnSender?: AuthnSender) {
    super(waku, keys)
    this.authenticator = Authenticator.create(
      this.waku.libp2p,
      this.keys.identityKey,
      { sender: authnSender ?? new MockAuthnSender(true) }
    )
  }

  static async create(
    wallet: Signer,
    opts?: Partial<TestClientOptions>
  ): Promise<TestClient> {
    const clientOptions = defaultOptions(opts)

    const waku = await createWaku(clientOptions)
    const keys = await PrivateKeyBundle.generate(wallet)
    const c = new TestClient(waku, keys, opts?.authOpts?.sender)
    await c.init(clientOptions)
    return c
  }
}
