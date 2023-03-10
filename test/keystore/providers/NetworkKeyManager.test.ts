import ApiClient, { ApiUrls } from '../../../src/ApiClient'
import { PrivateKeyBundleV1 } from '../../../src/crypto/PrivateKeyBundle'
import TopicPersistence from '../../../src/keystore/persistence/TopicPersistence'
import NetworkKeyManager from '../../../src/keystore/providers/NetworkKeyManager'
import { Signer } from '../../../src/types/Signer'
import { newWallet, sleep, wrapAsLedgerWallet } from '../../helpers'

describe('NetworkKeyManager', () => {
  let wallet: Signer
  let persistence: TopicPersistence

  beforeEach(async () => {
    wallet = newWallet()
    persistence = new TopicPersistence(new ApiClient(ApiUrls['local']))
  })

  it('encrypts with Ledger and decrypts with Metamask', async () => {
    const wallet = newWallet()
    const ledgerLikeWallet = wrapAsLedgerWallet(wallet)
    const secureLedgerStore = new NetworkKeyManager(
      ledgerLikeWallet,
      persistence
    )
    const secureNormalStore = new NetworkKeyManager(wallet, persistence)
    const originalBundle = await PrivateKeyBundleV1.generate(ledgerLikeWallet)

    await secureLedgerStore.storePrivateKeyBundle(originalBundle)
    await sleep(100)
    const returnedBundle = await secureNormalStore.loadPrivateKeyBundle()
    if (!returnedBundle) {
      throw new Error('No bundle returned')
    }

    expect(returnedBundle).toBeDefined()
    expect(originalBundle.identityKey.toBytes()).toEqual(
      returnedBundle.identityKey.toBytes()
    )
    expect(originalBundle.preKeys).toHaveLength(returnedBundle.preKeys.length)
    expect(originalBundle.preKeys[0].toBytes()).toEqual(
      returnedBundle.preKeys[0].toBytes()
    )
  })

  it('encrypts with Metamask and decrypts with Ledger', async () => {
    const wallet = newWallet()
    const ledgerLikeWallet = wrapAsLedgerWallet(wallet)
    const ledgerManager = new NetworkKeyManager(ledgerLikeWallet, persistence)
    const normalManager = new NetworkKeyManager(wallet, persistence)
    const originalBundle = await PrivateKeyBundleV1.generate(wallet)

    await normalManager.storePrivateKeyBundle(originalBundle)
    await sleep(100)
    const returnedBundle = await ledgerManager.loadPrivateKeyBundle()
    if (!returnedBundle) {
      throw new Error('No bundle returned')
    }

    expect(returnedBundle).toBeDefined()
    expect(originalBundle.identityKey.toBytes()).toEqual(
      returnedBundle.identityKey.toBytes()
    )
    expect(originalBundle.preKeys).toHaveLength(returnedBundle.preKeys.length)
    expect(originalBundle.preKeys[0].toBytes()).toEqual(
      returnedBundle.preKeys[0].toBytes()
    )
  })
})
