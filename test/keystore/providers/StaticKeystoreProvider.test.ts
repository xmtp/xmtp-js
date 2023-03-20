import { privateKey } from '@xmtp/proto'
import { PrivateKeyBundleV1 } from '../../../src/crypto'
import { newWallet } from '../../helpers'
import StaticKeystoreProvider from '../../../src/keystore/providers/StaticKeystoreProvider'
import { KeystoreProviderUnavailableError } from '../../../src/keystore/providers/errors'

const ENV = 'local'

describe('StaticKeystoreProvider', () => {
  it('works with a valid key', async () => {
    const key = await PrivateKeyBundleV1.generate(newWallet())
    const keyBytes = privateKey.PrivateKeyBundle.encode({
      v1: key,
      v2: undefined,
      v3: undefined,
    }).finish()
    const provider = new StaticKeystoreProvider()
    const keystore = await provider.newKeystore({
      privateKeyOverride: keyBytes,
      env: ENV,
      persistConversations: false,
    })

    expect(keystore).not.toBeNull()
  })

  it('throws with an unset key', async () => {
    expect(
      new StaticKeystoreProvider().newKeystore({
        env: ENV,
        persistConversations: false,
      })
    ).rejects.toThrow(KeystoreProviderUnavailableError)
  })

  it('fails with an invalid key', async () => {
    expect(
      new StaticKeystoreProvider().newKeystore({
        privateKeyOverride: Uint8Array.from([1, 2, 3]),
        env: ENV,
        persistConversations: false,
      })
    ).rejects.toThrow()
  })
})
