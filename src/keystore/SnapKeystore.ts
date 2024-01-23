import { SnapMeta, snapRPC } from './snapHelpers'
import type { XmtpEnv } from '../Client'
import {
  SnapKeystoreApiEntries,
  SnapKeystoreApiRequestValues,
  SnapKeystoreInterface,
  snapApiDefs,
} from './rpcDefinitions'

export function SnapKeystore(
  walletAddress: string,
  env: XmtpEnv,
  snapId: string
) {
  const generatedMethods: Partial<SnapKeystoreInterface> = {}

  const snapMeta: SnapMeta = {
    walletAddress,
    env,
  }

  for (const [method, rpc] of Object.entries(
    snapApiDefs
  ) as SnapKeystoreApiEntries) {
    generatedMethods[method] = async (req?: SnapKeystoreApiRequestValues) => {
      if (!rpc.req) {
        return snapRPC(method, rpc, undefined, snapMeta, snapId)
      }
      return snapRPC(method, rpc, req, snapMeta, snapId)
    }
  }

  return {
    ...generatedMethods,
    // Don't bother calling the keystore, since we already have the wallet address
    async getAccountAddress() {
      return walletAddress
    },
  } as SnapKeystoreInterface
}
