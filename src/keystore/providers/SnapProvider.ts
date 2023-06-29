import { KeystoreProviderUnavailableError } from './errors'
import { Keystore } from '../interfaces'
import { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import { SnapKeystore } from '../SnapKeystore'
import { connectSnap, getSnap, getWalletStatus, isFlask } from '../snapHelpers'
import { GetKeystoreStatusResponse_KeystoreStatus as KeystoreStatus } from '@xmtp/proto/ts/dist/types/keystore_api/v1/keystore.pb'
import { Signer } from '../../types/Signer'
import ApiClient from '../../ApiClient'

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
    await initSnap(wallet)

    return SnapKeystore()
  }
}

async function initSnap(wallet: Signer) {
  const status = await getWalletStatus(await wallet.getAddress())
  if (status === KeystoreStatus.KEYSTORE_STATUS_UNINITIALIZED) {
    const bundle = await getBundle(wallet)
  }
}
