import HttpApiClient, { ApiClient, ApiUrls } from '../../../src/ApiClient'
import {
  KeystoreProviderOptions,
  KeystoreProviderUnavailableError,
} from '../../../src/keystore/providers'
import { newWallet } from '../../helpers'
import SnapKeystoreProvider from '../../../src/keystore/providers/SnapProvider'
import {
  connectSnap,
  getSnap,
  getWalletStatus,
  hasMetamaskWithSnaps,
  initSnap,
} from '../../../src/keystore/snapHelpers'
import { Signer } from '../../../src/types/Signer'
import { keystore as keystoreProto } from '@xmtp/proto'

jest.mock('../../../src/keystore/snapHelpers')

describe('SnapProvider', () => {
  const provider = new SnapKeystoreProvider()
  const options = { env: 'local' } as KeystoreProviderOptions
  let apiClient: ApiClient
  let wallet: Signer

  beforeEach(async () => {
    apiClient = new HttpApiClient(ApiUrls['local'])
    wallet = newWallet()
    jest.resetAllMocks()
  })

  it('should throw an error if no wallet is provided', async () => {
    await expect(
      provider.newKeystore(options, apiClient, undefined)
    ).rejects.toThrow('No wallet provided')
  })

  it('should throw a KeystoreProviderUnavailableError if MetaMask with Snaps is not detected', async () => {
    ;(hasMetamaskWithSnaps as jest.Mock).mockReturnValue(Promise.resolve(false))

    await expect(
      provider.newKeystore(options, apiClient, wallet)
    ).rejects.toThrow(
      new KeystoreProviderUnavailableError('MetaMask with Snaps not detected')
    )
  })

  it('should attempt to connect to the snap if it is not already connected', async () => {
    ;(hasMetamaskWithSnaps as jest.Mock).mockReturnValue(Promise.resolve(true))
    ;(getWalletStatus as jest.Mock).mockReturnValue(
      Promise.resolve(
        keystoreProto.GetKeystoreStatusResponse_KeystoreStatus
          .KEYSTORE_STATUS_INITIALIZED
      )
    )
    ;(getSnap as jest.Mock).mockReturnValue(Promise.resolve(undefined))

    const keystore = await provider.newKeystore(options, apiClient, wallet)

    expect(keystore).toBeDefined()
    expect(getWalletStatus as jest.Mock).toHaveBeenCalledTimes(1)
    expect(getSnap as jest.Mock).toHaveBeenCalledTimes(1)
    expect(connectSnap as jest.Mock).toHaveBeenCalledTimes(1)
    expect(initSnap as jest.Mock).not.toHaveBeenCalled()
  })

  it('does not attempt to connect to the snap if it is already connected', async () => {
    ;(hasMetamaskWithSnaps as jest.Mock).mockReturnValue(Promise.resolve(true))
    ;(getWalletStatus as jest.Mock).mockReturnValue(
      Promise.resolve(
        keystoreProto.GetKeystoreStatusResponse_KeystoreStatus
          .KEYSTORE_STATUS_INITIALIZED
      )
    )
    ;(getSnap as jest.Mock).mockReturnValue(Promise.resolve({}))
    ;(connectSnap as jest.Mock).mockReturnValue(Promise.resolve())

    await provider.newKeystore(options, apiClient, wallet)
    expect(connectSnap as jest.Mock).not.toHaveBeenCalled()
  })

  it('initializes the snap if it is not already initialized', async () => {
    ;(hasMetamaskWithSnaps as jest.Mock).mockReturnValue(Promise.resolve(true))
    ;(getWalletStatus as jest.Mock).mockReturnValue(
      Promise.resolve(
        keystoreProto.GetKeystoreStatusResponse_KeystoreStatus
          .KEYSTORE_STATUS_UNINITIALIZED
      )
    )
    ;(getSnap as jest.Mock).mockReturnValue(Promise.resolve({}))
    ;(connectSnap as jest.Mock).mockReturnValue(Promise.resolve())
    ;(initSnap as jest.Mock).mockReturnValue(Promise.resolve())

    const keystore = await provider.newKeystore(options, apiClient, wallet)

    expect(keystore).toBeDefined()
    expect(initSnap as jest.Mock).toHaveBeenCalledTimes(1)
  })
})
