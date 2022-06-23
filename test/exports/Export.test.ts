// This test suite is used to generate test cases to be exported to other implementations and is not run as part of
// the normal test suite (see: npm run export:testcases)

import { ExportAuthSender } from '../authn/helpers'
import { LOCAL_DOCKER_MULTIADDR, newWallet } from '../helpers'
import { TestClient } from '../testClient'

describe('Export', () => {
  jest.setTimeout(10000)

  it('Auth TestCases', async () => {
    // Export sender logs AuthRequests to console prior to sending them over the wire
    const exportSender = new ExportAuthSender()
    const c = await TestClient.create(newWallet(), {
      authOpts: { alternativeSender: exportSender },
      bootstrapAddrs: [LOCAL_DOCKER_MULTIADDR],
    })
  })
})
