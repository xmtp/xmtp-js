import { keystore } from '@xmtp/proto'
import type { XmtpEnv } from '@/Client'
import type { PrivateKeyBundleV1 } from '@/crypto/PrivateKeyBundle'
import { b64Decode, b64Encode } from '@/utils/bytes'
import { getEthereum } from '@/utils/ethereum'
import { isSameMajorVersion } from '@/utils/semver'
import { KeystoreError } from './errors'
import type {
  SnapKeystoreApiDefs,
  SnapKeystoreApiMethods,
  SnapKeystoreApiRequestEncoders,
  SnapKeystoreApiResponseDecoders,
  SnapKeystoreInterfaceRequestValues,
} from './rpcDefinitions'

const {
  GetKeystoreStatusResponse_KeystoreStatus: KeystoreStatus,
  InitKeystoreRequest,
  InitKeystoreResponse,
  GetKeystoreStatusRequest,
  GetKeystoreStatusResponse,
} = keystore

export type SnapMeta = {
  walletAddress: string
  env: XmtpEnv
}

type SnapParams = {
  meta: SnapMeta
  req?: string
}

type SnapResponse = {
  res: string | string[]
}

export async function snapRPC<T extends SnapKeystoreApiMethods>(
  method: T,
  rpc: SnapKeystoreApiDefs[T],
  req: SnapKeystoreInterfaceRequestValues[T],
  meta: SnapMeta,
  snapId: string
) {
  let reqParam = null
  if (rpc.req) {
    const encoder = rpc.req.encode as SnapKeystoreApiRequestEncoders[T]
    const reqBytes = encoder(req).finish()
    reqParam = b64Encode(reqBytes, 0, reqBytes.length)
  }

  const responseString = await snapRequest(method, reqParam, meta, snapId)
  if (Array.isArray(responseString)) {
    throw new Error('Unexpected array response')
  }

  return rpc.res.decode(b64Decode(responseString)) as ReturnType<
    SnapKeystoreApiResponseDecoders[T]
  >
}

export async function snapRequest(
  method: SnapKeystoreApiMethods,
  req: string | null,
  meta: SnapMeta,
  snapId: string
) {
  const params: SnapParams = { meta }
  if (typeof req === 'string') {
    params.req = req
  }
  const response = await getEthereum()?.request<SnapResponse>({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method,
        params,
      },
    },
  })

  if (!response || typeof response !== 'object') {
    throw new Error('No response value')
  }

  return (response as SnapResponse).res
}

export type Snap = {
  permissionName: string
  id: string
  version: string
  initialPermissions: Record<string, unknown>
}

export type GetSnapsResponse = Record<string, Snap>

// If a browser has multiple providers, but one of them supports MetaMask flask
// this function will ensure that Flask is being used and return true.
// Designed to be resistant to provider clobbering by Phantom and CBW
// Inspired by https://github.com/Montoya/snap-connect-test/blob/main/index.html
export async function hasMetamaskWithSnaps() {
  const ethereum = getEthereum()
  // Naive way of detecting snaps support
  if (ethereum?.isMetaMask) {
    try {
      await ethereum.request({
        method: 'wallet_getSnaps',
      })
      return true
    } catch {
      // no-op
    }
  }
  if (
    typeof ethereum?.detected !== 'undefined' &&
    Array.isArray(ethereum.detected)
  ) {
    for (const provider of ethereum.detected) {
      try {
        // Detect snaps support
        await provider.request({
          method: 'wallet_getSnaps',
        })
        // enforces MetaMask as provider
        ethereum?.setProvider?.(provider)

        return true
      } catch {
        // no-op
      }
    }
  }

  if (
    typeof ethereum?.providers !== 'undefined' &&
    Array.isArray(ethereum.providers)
  ) {
    for (const provider of ethereum.providers) {
      try {
        // Detect snaps support
        await provider.request({
          method: 'wallet_getSnaps',
        })

        window.ethereum = provider

        return true
      } catch {
        // no-op
      }
    }
  }

  return false
}

export async function getSnaps() {
  return await getEthereum()?.request<GetSnapsResponse>({
    method: 'wallet_getSnaps',
  })
}

export async function getSnap(
  snapId: string,
  version?: string
): Promise<Snap | undefined> {
  try {
    const snaps = await getSnaps()

    if (snaps) {
      return Object.values(snaps).find(
        (snap) =>
          snap &&
          snap.id === snapId &&
          (!version || isSameMajorVersion(snap.version, version))
      )
    }

    return undefined
  } catch (e) {
    console.warn('Failed to obtain installed snap', e)
    return undefined
  }
}

export async function connectSnap(
  snapId: string,
  params: Record<'version' | string, unknown> = {}
) {
  await getEthereum()?.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  })
}

const getWalletStatusCodec = {
  req: GetKeystoreStatusRequest,
  res: GetKeystoreStatusResponse,
}

export async function getWalletStatus(meta: SnapMeta, snapId: string) {
  const response = await snapRPC(
    'getKeystoreStatus',
    getWalletStatusCodec,
    {
      walletAddress: meta.walletAddress,
    },
    meta,
    snapId
  )

  if (
    [
      KeystoreStatus.KEYSTORE_STATUS_UNSPECIFIED,
      KeystoreStatus.UNRECOGNIZED,
    ].includes(response.status)
  ) {
    throw new Error('No status specified in response')
  }

  return response.status
}

const initKeystoreCodec = {
  req: InitKeystoreRequest,
  res: InitKeystoreResponse,
}

export async function initSnap(
  bundle: PrivateKeyBundleV1,
  env: XmtpEnv,
  snapId: string
) {
  const walletAddress = bundle.identityKey.publicKey.walletSignatureAddress()
  const response = await snapRPC(
    'initKeystore',
    initKeystoreCodec,
    {
      v1: bundle,
    },
    { walletAddress, env },
    snapId
  )
  if (response.error) {
    throw new KeystoreError(response.error.code, response.error.message)
  }
}
