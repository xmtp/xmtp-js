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

export default class SnapKeystoreProvider implements KeystoreProvider {
  async newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet: Signer
  ): Promise<Keystore> {
    if (!isFlask()) {
      throw new KeystoreProviderUnavailableError('Flask not detected')
    }
    const hasSnap = await getSnap()
    if (!hasSnap) {
      await connectSnap()
    }

    if (!(await checkSnapLoaded(await wallet.getAddress()))) {
      const bundle = await getBundle(opts, apiClient, wallet)
      await initSnap(bundle)
    }

    return SnapKeystore()
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
