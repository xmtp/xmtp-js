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
const { b64Encode, b64Decode } = fetcher
const ethereum = window.ethereum

type Codec<T> = {
  decode(input: Reader | Uint8Array, length?: number): T
  encode(message: T, writer?: Writer): Writer
}
type ApiDefs = {
  [k: string]: {
    req: Codec<any> | null
    res: Codec<any>
  }
}

export const defaultSnapOrigin = `local:http://localhost:8080`

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
  const generatedMethods: any = {}

  for (const [method, apiDef] of Object.entries(apiDefs)) {
    generatedMethods[method] = async (req: any) => {
      if (!apiDef.req) {
        return getResponse(method as keyof Keystore, null, apiDef.res)
      }

      const reqBytes = apiDef.req.encode(req).finish()
      return getResponse(method as keyof Keystore, reqBytes, apiDef.res)
    }
  }

  return {
    ...generatedMethods,
    async getV2Conversations() {
      const rawResponse = await ethereumRequest('getV2Conversations', null)
      if (Array.isArray(rawResponse)) {
        return rawResponse.map((r) =>
          conversationReference.ConversationReference.decode(
            fetcher.b64Decode(r)
          )
        )
      }
    },
    async getAccountAddress() {
      const rawResponse = await ethereumRequest('getAccountAddress', null)
      if (Array.isArray(rawResponse)) {
        throw new Error('Unexpected array response')
      }
      return rawResponse
    },
  }
}

async function ethereumRequest<T extends keyof Keystore>(
  method: T,
  req: Uint8Array | null
): Promise<string | string[]> {
  const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method,
        params: { req: req ? b64Encode(req, 0, req.length) : null },
      },
    },
  })

  if (!response || typeof response !== 'object') {
    throw new Error('No response value')
  }

  return (response as any).res as unknown as string | string[]
}

async function getResponse<T extends keyof Keystore>(
  method: T,
  req: Uint8Array | null,
  resDecoder: typeof apiDefs[T]['res']
): Promise<typeof apiDefs[T]['res']> {
  const responseString = await ethereumRequest(method, req)
  if (Array.isArray(responseString)) {
    throw new Error('Unexpected array response')
  }
  return resDecoder.decode(b64Decode(responseString))
}
