import { fetcher, keystore as keystoreProto } from '@xmtp/proto'
import type { SnapRPC } from './SnapKeystore'
import { b64Decode } from '../utils/bytes'
import { KeystoreError } from './errors'
import { PrivateKeyBundleV1 } from '../crypto'
const {
  GetKeystoreStatusResponse_KeystoreStatus: KeystoreStatus,
  InitKeystoreRequest,
  InitKeystoreResponse,
  GetKeystoreStatusRequest,
  GetKeystoreStatusResponse,
} = keystoreProto

const { b64Encode } = fetcher

const ethereum = window.ethereum
// TODO: Replace with npm package once released
export const defaultSnapOrigin = `local:http://localhost:8080`

export async function snapRPC<Req, Res>(
  method: string,
  codecs: SnapRPC<Req, Res>,
  req: Req
): Promise<Res> {
  let reqParam = null
  if (codecs.req) {
    const reqBytes = codecs.req.encode(req).finish()
    reqParam = b64Encode(reqBytes, 0, reqBytes.length)
  }

  const responseString = await snapRequest(method, reqParam)
  if (Array.isArray(responseString)) {
    throw new Error('Unexpected array response')
  }

  return codecs.res.decode(b64Decode(responseString))
}

export async function snapRequest(
  method: string,
  req: string | null
): Promise<string> {
  const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method,
        params: { req },
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
    const clientVersion = await ethereum?.request({
      method: 'web3_clientVersion',
    })

    const isFlaskDetected = (clientVersion as string[])?.includes('flask')

    return Boolean(ethereum && isFlaskDetected)
  } catch {
    return false
  }
}

export async function getSnaps(): Promise<GetSnapsResponse> {
  return (await ethereum.request({
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
  await ethereum.request({
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
export async function getWalletStatus(walletAddress: string) {
  const response = await snapRPC('getKeystoreStatus', getWalletStatusCodec, {
    walletAddress,
  })

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
export async function initSnap(bundle: PrivateKeyBundleV1) {
  const response = await snapRPC('initKeystore', initKeystoreCodec, {
    v1: bundle,
  })
  if (response.error) {
    throw new KeystoreError(response.error.code, response.error.message)
  }
}
