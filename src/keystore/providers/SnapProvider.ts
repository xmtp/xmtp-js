import { keystore } from '@xmtp/proto'
import type { ApiClient } from '@/ApiClient'
import type { XmtpEnv } from '@/Client'
import {
  decodePrivateKeyBundle,
  PrivateKeyBundleV1,
} from '@/crypto/PrivateKeyBundle'
import type { SnapKeystoreInterface } from '@/keystore/rpcDefinitions'
import {
  connectSnap,
  getSnap,
  getWalletStatus,
  hasMetamaskWithSnaps,
  initSnap,
} from '@/keystore/snapHelpers'
import { SnapKeystore } from '@/keystore/SnapKeystore'
import type { Signer } from '@/types/Signer'
import { semverGreaterThan } from '@/utils/semver'
import { KeystoreProviderUnavailableError } from './errors'
import type { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import KeyGeneratorKeystoreProvider from './KeyGeneratorKeystoreProvider'
import NetworkKeystoreProvider from './NetworkKeystoreProvider'

const { GetKeystoreStatusResponse_KeystoreStatus: KeystoreStatus } = keystore

export const SNAP_LOCAL_ORIGIN = 'local:http://localhost:8080'

/**
 * The Snap keystore provider will:
 * 1. Check if the user is capable of using Snaps
 * 2. Check if the user has already setup the Snap with the appropriate keys
 * 3. If not, will get keys from the network or create new keys and store them in the Snap
 */
export default class SnapKeystoreProvider
  implements KeystoreProvider<SnapKeystoreInterface>
{
  snapId: string
  snapVersion?: string

  constructor(snapId = SNAP_LOCAL_ORIGIN, snapVersion?: string) {
    this.snapId = snapId
    this.snapVersion = snapVersion
  }

  async newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet?: Signer
  ) {
    if (!wallet) {
      throw new KeystoreProviderUnavailableError('No wallet provided')
    }

    if (!(await hasMetamaskWithSnaps())) {
      throw new KeystoreProviderUnavailableError(
        'MetaMask with Snaps not detected'
      )
    }

    const walletAddress = await wallet.getAddress()
    const env = opts.env
    const hasSnap = await getSnap(this.snapId, this.snapVersion)
    if (!hasSnap || semverGreaterThan(this.snapVersion, hasSnap.version)) {
      await connectSnap(
        this.snapId,
        this.snapVersion ? { version: this.snapVersion } : {}
      )
    }

    if (!(await checkSnapLoaded(walletAddress, env, this.snapId))) {
      const bundle = await bundleFromOptions(opts, apiClient, wallet)
      await initSnap(bundle, env, this.snapId)
    }

    return SnapKeystore(walletAddress, env, this.snapId)
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

async function bundleFromOptions(
  opts: KeystoreProviderOptions,
  apiClient: ApiClient,
  wallet?: Signer
) {
  if (opts.privateKeyOverride) {
    const bundle = decodePrivateKeyBundle(opts.privateKeyOverride)
    if (!(bundle instanceof PrivateKeyBundleV1)) {
      throw new Error('Unsupported private key bundle version')
    }
    return bundle
  }

  if (!wallet) {
    throw new Error('No privateKeyOverride or wallet')
  }

  return getOrCreateBundle(opts, apiClient, wallet)
}

async function getOrCreateBundle(
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

async function checkSnapLoaded(
  walletAddress: string,
  env: XmtpEnv,
  snapId: string
) {
  const status = await getWalletStatus({ walletAddress, env }, snapId)
  if (status === KeystoreStatus.KEYSTORE_STATUS_INITIALIZED) {
    return true
  }
  return false
}
