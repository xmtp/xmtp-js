import { keystore as keystoreProto } from '@xmtp/proto'
import type { RPC } from './rpcDefinitions'
import { b64Decode, b64Encode } from '../utils/bytes'
import { KeystoreError } from './errors'
import { PrivateKeyBundleV1 } from '../crypto'
import { getEthereum } from '../utils/ethereum'
import type { XmtpEnv } from '../Client'
const {
  GetKeystoreStatusResponse_KeystoreStatus: KeystoreStatus,
  InitKeystoreRequest,
  InitKeystoreResponse,
  GetKeystoreStatusRequest,
  GetKeystoreStatusResponse,
} = keystoreProto

// TODO: Replace with npm package once released
export const defaultSnapOrigin = `local:http://localhost:8080`

export type SnapMeta = {
  walletAddress: string
  env: XmtpEnv
}

type SnapParams = {
  meta: SnapMeta
  req?: string
}

export async function snapRPC<Req, Res>(
  method: string,
  codecs: RPC<Req, Res>,
  req: Req,
  meta: SnapMeta
): Promise<Res> {
  let reqParam = null
  if (codecs.req) {
    const reqBytes = codecs.req.encode(req).finish()
    reqParam = b64Encode(reqBytes, 0, reqBytes.length)
  }

  const responseString = await snapRequest(method, reqParam, meta)
  if (Array.isArray(responseString)) {
    throw new Error('Unexpected array response')
  }

  return codecs.res.decode(b64Decode(responseString))
}

export async function snapRequest(
  method: string,
  req: string | null,
  meta: SnapMeta
): Promise<string> {
  const params: SnapParams = { meta }
  if (typeof req === 'string') {
    params.req = req
  }
  const response = await getEthereum().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method,
        params,
      },
    },
  })

  if (!response || typeof response !== 'object') {
    throw new Error('No response value')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (response as any).res as unknown as string
}

export type Snap = {
  permissionName: string
  id: string
  version: string
  initialPermissions: Record<string, unknown>
}

export type GetSnapsResponse = Record<string, Snap>

export async function isFlask() {
  try {
    const ethereum = getEthereum()
    const clientVersion = await ethereum?.request({
      method: 'web3_clientVersion',
    })
    const isFlaskDetected = (clientVersion as string[])?.includes('flask')

    return Boolean(ethereum && isFlaskDetected)
  } catch (e) {
    return false
  }
}

// If a browser has multiple providers, but one of them supports MetaMask flask
// this function will ensure that Flask is being used and return true.
// Designed to be resistant to provider clobbering by Phantom and CBW
// Inspired by https://github.com/Montoya/snap-connect-test/blob/main/index.html
export async function hasMetamaskWithSnaps() {
  if ('detected' in window.ethereum) {
    for (const provider of window.ethereum.detected) {
      try {
        // Detect snaps support
        await provider.request({
          method: 'wallet_getSnaps',
        })
        // enforces MetaMask as provider
        window.ethereum.setProvider(provider)

        return true
      } catch {
        // no-op
      }
    }
  }

  if ('providers' in window.ethereum) {
    for (const provider of window.ethereum.providers) {
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

    return false
  }

  return window.ethereum
}

export async function getSnaps(): Promise<GetSnapsResponse> {
  return (await getEthereum()?.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse
}

export async function getSnap(version?: string): Promise<Snap | undefined> {
  try {
    const snaps = await getSnaps()

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version)
    )
  } catch (e) {
    console.warn('Failed to obtain installed snap', e)
    return undefined
  }
}

export async function connectSnap(
  snapId: string = defaultSnapOrigin,
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
export async function getWalletStatus(meta: SnapMeta) {
  const response = await snapRPC(
    'getKeystoreStatus',
    getWalletStatusCodec,
    {
      walletAddress: meta.walletAddress,
    },
    meta
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
export async function initSnap(bundle: PrivateKeyBundleV1, env: XmtpEnv) {
  const walletAddress = bundle.identityKey.publicKey.walletSignatureAddress()
  const response = await snapRPC(
    'initKeystore',
    initKeystoreCodec,
    {
      v1: bundle,
    },
    { walletAddress, env }
  )
  if (response.error) {
    throw new KeystoreError(response.error.code, response.error.message)
  }
}
