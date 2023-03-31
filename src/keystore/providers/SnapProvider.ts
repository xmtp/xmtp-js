import { KeystoreProviderUnavailableError } from './errors'
import { Keystore } from './../interfaces'
import { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import { defaultSnapOrigin, SnapKeystore } from '../SnapKeystore'

export type Snap = {
  permissionName: string
  id: string
  version: string
  initialPermissions: Record<string, unknown>
}

export type GetSnapsResponse = Record<string, Snap>

const isFlask = async () => {
  const provider = window.ethereum

  try {
    const clientVersion = await provider?.request({
      method: 'web3_clientVersion',
    })

    const isFlaskDetected = (clientVersion as string[])?.includes('flask')

    return Boolean(provider && isFlaskDetected)
  } catch {
    return false
  }
}

const getSnaps = async (): Promise<GetSnapsResponse> => {
  console.log('Getting snap')
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse
}

const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps()

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version)
    )
  } catch (e) {
    console.log('Failed to obtain installed snap', e)
    return undefined
  }
}

const initSnap = async () => {
  await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'init',
      },
    },
  })
}

const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {}
) => {
  console.log('Connecting snap')
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  })
}

export default class SnapKeystoreProvider implements KeystoreProvider {
  async newKeystore(opts: KeystoreProviderOptions): Promise<Keystore> {
    if (!isFlask()) {
      throw new KeystoreProviderUnavailableError('Flask not detected')
    }
    const hasSnap = await getSnap()
    console.log('hasSnap', hasSnap)
    if (!hasSnap) {
      await connectSnap()
    }
    await initSnap()

    return SnapKeystore()
  }
}
