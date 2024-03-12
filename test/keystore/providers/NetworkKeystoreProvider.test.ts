import { privateKey } from '@xmtp/proto'
import { KeystoreProviderUnavailableError } from './../../../src/keystore/providers/errors'
import ApiClient, { ApiUrls } from '../../../src/ApiClient'
import { encrypt, PrivateKeyBundleV1 } from '../../../src/crypto'
import NetworkKeystoreProvider from '../../../src/keystore/providers/NetworkKeystoreProvider'
import { Signer } from '../../../src/types/Signer'
import { newWallet } from '../../helpers'
import { testProviderOptions } from './helpers'
import NetworkKeyManager, {
  storageSigRequestText,
} from '../../../src/keystore/providers/NetworkKeyManager'
import TopicPersistence from '../../../src/keystore/persistence/TopicPersistence'
import { LocalAuthenticator } from '../../../src/authn'
import crypto from '../../../src/crypto/crypto'
import { vi } from 'vitest'
import { Hex, hexToBytes } from 'viem'

describe('NetworkKeystoreProvider', () => {
  let apiClient: ApiClient
  let bundle: PrivateKeyBundleV1
  let wallet: Signer

  beforeEach(async () => {
    apiClient = new ApiClient(ApiUrls['local'])
    wallet = newWallet()
    bundle = await PrivateKeyBundleV1.generate(wallet)
  })

  it('fails gracefully when no keys are found', async () => {
    const provider = new NetworkKeystoreProvider()
    expect(
      provider.newKeystore(testProviderOptions({}), apiClient, wallet)
    ).rejects.toThrow(KeystoreProviderUnavailableError)
  })

  it('loads keys when they are already set', async () => {
    const manager = new NetworkKeyManager(
      wallet,
      new TopicPersistence(apiClient)
    )
    await manager.storePrivateKeyBundle(bundle)

    const provider = new NetworkKeystoreProvider()
    const keystore = await provider.newKeystore(
      testProviderOptions({}),
      apiClient,
      wallet
    )
    expect(await keystore.getPublicKeyBundle()).toEqual(
      bundle.getPublicKeyBundle()
    )
  })

  it('properly handles legacy keys', async () => {
    // Create a legacy EncryptedPrivateKeyBundleV1 and store it on the node
    const bytes = bundle.encode()
    const wPreKey = crypto.getRandomValues(new Uint8Array(32))
    const input = storageSigRequestText(wPreKey)
    const walletAddr = await wallet.getAddress()

    let sig = await wallet.signMessage(input)
    const secret = hexToBytes(sig as Hex)
    const ciphertext = await encrypt(bytes, secret)
    const bytesToStore = privateKey.EncryptedPrivateKeyBundleV1.encode({
      ciphertext,
      walletPreKey: wPreKey,
    }).finish()

    // Store the legacy key on the node
    apiClient.setAuthenticator(new LocalAuthenticator(bundle.identityKey))
    const persistence = new TopicPersistence(apiClient)
    const key = `${walletAddr}/key_bundle`
    await persistence.setItem(key, bytesToStore)

    // Now try and load it
    const provider = new NetworkKeystoreProvider()
    const keystore = await provider.newKeystore(
      testProviderOptions({}),
      apiClient,
      wallet
    )
    expect(keystore).toBeDefined()
  })

  it('correctly calls notifier on load', async () => {
    const manager = new NetworkKeyManager(
      wallet,
      new TopicPersistence(apiClient)
    )
    await manager.storePrivateKeyBundle(bundle)

    const provider = new NetworkKeystoreProvider()
    const mockNotifier = vi.fn()
    await provider.newKeystore(
      { ...testProviderOptions({}), preEnableIdentityCallback: mockNotifier },
      apiClient,
      wallet
    )
    expect(mockNotifier).toHaveBeenCalledTimes(1)
  })
})
