import { keystore, authn, publicKey, signature } from '@xmtp/proto'
import { Reader, Writer } from 'protobufjs/minimal'
const {
  CreateInviteFromTopicRequest,
  CreateInvitesRequest,
  CreateInvitesResponse,
  GetV2ConversationsResponse,
} = keystore

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
  getV2Conversations: {
    req: null,
    res: GetV2ConversationsResponse,
  },
  getGroupConversations: {
    req: null,
    res: GetV2ConversationsResponse,
  },
  createInvites: {
    req: CreateInvitesRequest,
    res: CreateInvitesResponse,
  },
  createInviteFromTopic: {
    req: CreateInviteFromTopicRequest,
    res: CreateInvitesResponse,
  },
} as const
