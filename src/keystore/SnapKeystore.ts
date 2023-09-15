import { Keystore } from './interfaces'
import { SnapMeta, snapRPC } from './snapHelpers'
import type { XmtpEnv } from '../Client'
import { apiDefs } from './rpcDefinitions'

async function getResponse<T extends keyof Keystore>(
  method: T,
  req: Uint8Array | null,
  meta: SnapMeta,
  snapId: string
): Promise<typeof apiDefs[T]['res']> {
  return snapRPC(method, apiDefs[method], req, meta, snapId)
}

export function SnapKeystore(
  walletAddress: string,
  env: XmtpEnv,
  snapId: string
): Keystore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generatedMethods: any = {}

  const snapMeta: SnapMeta = {
    walletAddress,
    env,
  }

  for (const [method, apiDef] of Object.entries(apiDefs)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generatedMethods[method] = async (req: any) => {
      if (!apiDef.req) {
        return getResponse(method as keyof Keystore, null, snapMeta, snapId)
      }

      return getResponse(method as keyof Keystore, req, snapMeta, snapId)
    }
  }

  return {
    ...generatedMethods,
    // Don't bother calling the keystore, since we already have the wallet address
    async getAccountAddress() {
      return walletAddress
    },
  }
}
