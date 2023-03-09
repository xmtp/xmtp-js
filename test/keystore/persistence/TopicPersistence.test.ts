import { Signer } from './../../../src/types/Signer'
import ApiClient, { ApiUrls } from '../../../src/ApiClient'
import { newWallet } from '../../helpers'
import TopicPersistence from '../../../src/keystore/persistence/TopicPersistence'
import { Authenticator } from '../../../src/authn'
import { PrivateKeyBundleV1 } from '../../../src/crypto'

const TEST_KEY = 'foo'

describe('TopicPersistence', () => {
  let apiClient: ApiClient
  let bundle: PrivateKeyBundleV1
  beforeEach(async () => {
    apiClient = new ApiClient(ApiUrls['local'])
    bundle = await PrivateKeyBundleV1.generate(newWallet())
  })
  it('round trips items from the store', async () => {
    const input = new TextEncoder().encode('hello')
    apiClient.setAuthenticator(new Authenticator(bundle.identityKey))
    const store = new TopicPersistence(apiClient)
    await store.setItem(TEST_KEY, input)

    const output = await store.getItem(TEST_KEY)
    expect(output).toEqual(input)
  })

  it('returns null for missing items', async () => {
    const store = new TopicPersistence(apiClient)
    expect(await store.getItem(TEST_KEY)).toBeNull()
  })

  it('allows overwriting of values', async () => {
    const firstInput = new TextEncoder().encode('hello')
    apiClient.setAuthenticator(new Authenticator(bundle.identityKey))
    const store = new TopicPersistence(apiClient)
    await store.setItem(TEST_KEY, firstInput)
    expect(await store.getItem(TEST_KEY)).toEqual(firstInput)

    const secondInput = new TextEncoder().encode('goodbye')
    await store.setItem(TEST_KEY, secondInput)
    expect(await store.getItem(TEST_KEY)).toEqual(secondInput)
  })
})
