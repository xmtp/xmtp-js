import ApiClient, { ApiUrls, GrpcStatus, PublishParams } from '../src/ApiClient'
import { newWallet, sleep } from './helpers'
import { Authenticator } from '../src/authn'
import { buildUserPrivateStoreTopic, dateToNs } from '../src/utils'
import { Wallet } from 'ethers'
import { PrivateKeyBundleV1 } from '../src/crypto'

type TestCase = { name: string; api: string }

describe('e2e tests', () => {
  const tests: TestCase[] = [
    {
      name: 'local docker node',
      api: ApiUrls.local,
    },
  ]
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'dev',
      api: ApiUrls.dev,
    })
  }
  tests.forEach((testCase) => {
    describe(testCase.name, () => {
      let client: ApiClient
      let wallet: Wallet
      let keys: PrivateKeyBundleV1
      beforeEach(async () => {
        wallet = newWallet()
        client = new ApiClient(testCase.api)
        keys = await PrivateKeyBundleV1.generate(wallet)
        client.setAuthenticator(new Authenticator(keys.identityKey))
      })

      it('publish success', async () => {
        expect(
          await client.publish([
            {
              contentTopic: buildUserPrivateStoreTopic(wallet.address),
              message: new Uint8Array(5),
            },
          ])
        ).resolves
      })

      it('publish restricted topic', () => {
        expect(
          client.publish([
            {
              contentTopic: buildUserPrivateStoreTopic(
                keys.getPublicKeyBundle().preKey.getEthereumAddress()
              ),
              message: new Uint8Array(5),
            },
          ])
        ).rejects.toEqual({
          code: GrpcStatus.PERMISSION_DENIED,
          details: [],
          message: 'publishing to restricted topic',
        })
      })
    })
  })
})
