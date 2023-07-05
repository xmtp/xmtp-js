import { KeystoreProviderUnavailableError } from './errors'
import { Keystore } from '../interfaces'
import { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import { SnapKeystore } from '../SnapKeystore'
import {
  connectSnap,
  getSnap,
  getWalletStatus,
  initSnap,
  isFlask,
} from '../snapHelpers'
import { GetKeystoreStatusResponse_KeystoreStatus as KeystoreStatus } from '@xmtp/proto/ts/dist/types/keystore_api/v1/keystore.pb'
import { Signer } from '../../types/Signer'
import ApiClient from '../../ApiClient'
import NetworkKeystoreProvider from './NetworkKeystoreProvider'
import { PrivateKeyBundleV1 } from '../../crypto'
import KeyGeneratorKeystoreProvider from './KeyGeneratorKeystoreProvider'

/**
 * The Snap keystore provider will:
 * 1. Check if the user is capable of using Snaps
 * 2. Check if the user has already setup the Snap with the appropriate keys
 * 3. If not, will get keys from the network or create new keys and store them in the Snap
 */
export default class SnapKeystoreProvider implements KeystoreProvider {
  async newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet?: Signer
  ): Promise<Keystore> {
    if (!isFlask()) {
      throw new KeystoreProviderUnavailableError('Flask not detected')
    }
    if (!wallet) {
      throw new KeystoreProviderUnavailableError('No wallet provided')
    }
    const walletAddress = await wallet.getAddress()
    const hasSnap = await getSnap()
    if (!hasSnap) {
      await connectSnap()
    }

    if (!(await checkSnapLoaded(walletAddress))) {
      const bundle = await getBundle(opts, apiClient, wallet)
      await initSnap(bundle)
    }

    return SnapKeystore(walletAddress)
  }
}

async function createBundle(
  opts: KeystoreProviderOptions,
  apiClient: ApiClient,
  wallet: Signer
) {
  const tmpProvider = new KeyGeneratorKeystoreProvider()
  const tmpKeystore = await tmpProvider.newKeystore(opts, apiClient, wallet)
  return new PrivateKeyBundleV1(await tmpKeystore.getPrivateKeyBundle())
}

async function getBundle(
  opts: KeystoreProviderOptions,
  apiClient: ApiClient,
  wallet: Signer
): Promise<PrivateKeyBundleV1> {
  // I really don't love using other providers inside a provider. Feels like too much indirection
  // TODO: Refactor keystore providers to better support the weird Snap flow
  const networkProvider = new NetworkKeystoreProvider()
  try {
    const tmpKeystore = await networkProvider.newKeystore(
      opts,
      apiClient,
      wallet
    )
    return new PrivateKeyBundleV1(await tmpKeystore.getPrivateKeyBundle())
  } catch (e) {
    if (e instanceof KeystoreProviderUnavailableError) {
      return createBundle(opts, apiClient, wallet)
    }
    throw e
  }
}

async function checkSnapLoaded(walletAddress: string) {
  const status = await getWalletStatus(walletAddress)
  if (status === KeystoreStatus.KEYSTORE_STATUS_INITIALIZED) {
    return true
  }
  return false
}
