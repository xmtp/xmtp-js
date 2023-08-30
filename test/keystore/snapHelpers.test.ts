import {
  defaultSnapOrigin,
  getWalletStatus,
  hasMetamaskWithSnaps,
} from '../../src/keystore/snapHelpers'
import { keystore } from '@xmtp/proto'
import { b64Encode } from '../../src/utils'
const {
  GetKeystoreStatusRequest,
  GetKeystoreStatusResponse,
  GetKeystoreStatusResponse_KeystoreStatus: KeystoreStatus,
} = keystore

// Setup the mocks for window.ethereum
const mockRequest = jest.fn()
jest.mock('../../src/utils/ethereum', () => {
  return {
    __esModule: true,
    getEthereum: jest.fn(() => {
      const ethereum: any = {
        request: mockRequest,
      }
      ethereum.providers = [ethereum]
      ethereum.detected = [ethereum]
      return ethereum
    }),
  }
})

describe('snapHelpers', () => {
  beforeEach(() => {
    mockRequest.mockClear()
  })

  it('can check if the user has Flask installed', async () => {
    mockRequest.mockResolvedValue(['flask'])

    expect(await hasMetamaskWithSnaps()).toBe(true)
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  it('returns false when the user does not have flask installed', async () => {
    mockRequest.mockRejectedValue(new Error('foo'))

    expect(await hasMetamaskWithSnaps()).toBe(false)
    expect(mockRequest).toHaveBeenCalledTimes(2)
  })

  it('can check wallet status', async () => {
    const method = 'getKeystoreStatus'
    const walletAddress = '0xfoo'
    const env = 'dev'
    const resBytes = GetKeystoreStatusResponse.encode({
      status: KeystoreStatus.KEYSTORE_STATUS_INITIALIZED,
    }).finish()

    mockRequest.mockResolvedValue({
      res: b64Encode(resBytes, 0, resBytes.length),
    })

    const status = await getWalletStatus({ walletAddress, env })
    expect(status).toBe(KeystoreStatus.KEYSTORE_STATUS_INITIALIZED)
    const expectedRequest = GetKeystoreStatusRequest.encode({
      walletAddress,
    }).finish()

    expect(mockRequest).toHaveBeenCalledWith({
      method: 'wallet_invokeSnap',
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method,
          params: {
            req: b64Encode(expectedRequest, 0, expectedRequest.length),
            meta: { walletAddress, env },
          },
        },
      },
    })
  })
})
