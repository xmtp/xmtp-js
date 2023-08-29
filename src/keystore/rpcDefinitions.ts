import { keystore, authn, publicKey, signature } from '@xmtp/proto'
import { Reader, Writer } from 'protobufjs/minimal'

type Codec<T> = {
  decode(input: Reader | Uint8Array, length?: number): T
  encode(message: T, writer?: Writer): Writer
}

export type RPC<Req, Res> = {
  req: Codec<Req> | null
  res: Codec<Res>
}

type ApiDefs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: RPC<any, any>
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
  saveV1Conversations: {
    req: keystore.SaveV1ConversationsRequest,
    res: keystore.SaveV1ConversationsResponse,
  },
  getV1Conversations: {
    req: null,
    res: keystore.GetConversationsResponse,
  },
  getV2Conversations: {
    req: null,
    res: keystore.GetConversationsResponse,
  },
  getRefreshJob: {
    req: keystore.GetRefreshJobRequest,
    res: keystore.GetRefreshJobResponse,
  },
  setRefreshJob: {
    req: keystore.SetRefeshJobRequest,
    res: keystore.SetRefreshJobResponse,
  },
} as const
