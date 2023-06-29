import { Keystore } from './interfaces'
import {
  fetcher,
  conversationReference,
  keystore,
  authn,
  publicKey,
  signature,
} from '@xmtp/proto'
import { Reader, Writer } from 'protobufjs/minimal'
import { snapRPC, snapRequest } from './snapHelpers'

type Codec<T> = {
  decode(input: Reader | Uint8Array, length?: number): T
  encode(message: T, writer?: Writer): Writer
}

export type SnapRPC<Req, Res> = {
  req: Codec<Req> | null
  res: Codec<Res>
}

type ApiDefs = {
  [k: string]: SnapRPC<any, any>
}

async function getResponse<T extends keyof Keystore>(
  method: T,
  req: Uint8Array | null
): Promise<typeof apiDefs[T]['res']> {
  return snapRPC(method, apiDefs[method], req)
}

export const apiDefs: ApiDefs = {
  decryptV1: {
    req: keystore.DecryptV1Request,
    res: keystore.DecryptResponse,
  },
  encryptV1: {
    req: keystore.EncryptV1Request,
    res: keystore.EncryptResponse,
  },
  encryptV2: {
    req: keystore.EncryptV2Request,
    res: keystore.EncryptResponse,
  },
  decryptV2: {
    req: keystore.DecryptV2Request,
    res: keystore.DecryptResponse,
  },
  saveInvites: {
    req: keystore.SaveInvitesRequest,
    res: keystore.SaveInvitesResponse,
  },
  createInvite: {
    req: keystore.CreateInviteRequest,
    res: keystore.CreateInviteResponse,
  },
  createAuthToken: {
    req: keystore.CreateAuthTokenRequest,
    res: authn.Token,
  },
  signDigest: {
    req: keystore.SignDigestRequest,
    res: signature.Signature,
  },
  getPublicKeyBundle: {
    req: null,
    res: publicKey.PublicKeyBundle,
  },
} as const

export function SnapKeystore(): Keystore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generatedMethods: any = {}

  for (const [method, apiDef] of Object.entries(apiDefs)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generatedMethods[method] = async (req: any) => {
      if (!apiDef.req) {
        return getResponse(method as keyof Keystore, null)
      }

      return getResponse(method as keyof Keystore, req)
    }
  }

  return {
    ...generatedMethods,
    async getV2Conversations() {
      const rawResponse = await snapRequest('getV2Conversations', null)
      if (Array.isArray(rawResponse)) {
        return rawResponse.map((r) =>
          conversationReference.ConversationReference.decode(
            fetcher.b64Decode(r)
          )
        )
      }
    },
    async getAccountAddress() {
      const rawResponse = await snapRequest('getAccountAddress', null)
      if (Array.isArray(rawResponse)) {
        throw new Error('Unexpected array response')
      }
      return rawResponse
    },
  }
}
