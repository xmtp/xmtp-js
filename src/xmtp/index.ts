// @ts-nocheck
// THIS FILE IS GENERATED AUTOMATICALLY. DO NOT MODIFY.

import { StdFee } from '@cosmjs/launchpad'
import { SigningStargateClient } from '@cosmjs/stargate'
import {
  Registry,
  OfflineSigner,
  EncodeObject,
  DirectSecp256k1HdWallet,
} from '@cosmjs/proto-signing'
import { Api } from './rest'
import {
  MsgCreateMessage,
  MsgUpdateMessage,
  MsgCreateTopic,
  MsgUpdateTopic,
  MsgCreateContact,
} from './types/xmtp/tx'

const types = [
  ['/xmtp.xmtp.MsgCreateMessage', MsgCreateMessage],
  ['/xmtp.xmtp.MsgUpdateMessage', MsgUpdateMessage],
  ['/xmtp.xmtp.MsgCreateTopic', MsgCreateTopic],
  ['/xmtp.xmtp.MsgUpdateTopic', MsgUpdateTopic],
  ['/xmtp.xmtp.MsgCreateContact', MsgCreateContact],
]
export const MissingWalletError = new Error('wallet is required')

export const registry = new Registry(<any>types)

const defaultFee = {
  amount: [],
  gas: '200000',
}

interface TxClientOptions {
  addr: string
}

interface SignAndBroadcastOptions {
  fee: StdFee
  memo?: string
}

const txClient = async (
  wallet: OfflineSigner,
  { addr }: TxClientOptions = { addr: 'http://localhost:26657' }
) => {
  if (!wallet) throw MissingWalletError
  let client
  if (addr) {
    client = await SigningStargateClient.connectWithSigner(addr, wallet, {
      registry,
    })
  } else {
    client = await SigningStargateClient.offline(wallet, { registry })
  }
  const { address } = (await wallet.getAccounts())[0]

  return {
    signAndBroadcast: (
      msgs: EncodeObject[],
      { fee, memo }: SignAndBroadcastOptions = { fee: defaultFee, memo: '' }
    ) => client.signAndBroadcast(address, msgs, fee, memo),
    msgCreateMessage: (data: MsgCreateMessage): EncodeObject => ({
      typeUrl: '/xmtp.xmtp.MsgCreateMessage',
      value: MsgCreateMessage.fromPartial(data),
    }),
    msgUpdateMessage: (data: MsgUpdateMessage): EncodeObject => ({
      typeUrl: '/xmtp.xmtp.MsgUpdateMessage',
      value: MsgUpdateMessage.fromPartial(data),
    }),
    msgCreateTopic: (data: MsgCreateTopic): EncodeObject => ({
      typeUrl: '/xmtp.xmtp.MsgCreateTopic',
      value: MsgCreateTopic.fromPartial(data),
    }),
    msgUpdateTopic: (data: MsgUpdateTopic): EncodeObject => ({
      typeUrl: '/xmtp.xmtp.MsgUpdateTopic',
      value: MsgUpdateTopic.fromPartial(data),
    }),
    msgCreateContact: (data: MsgCreateContact): EncodeObject => ({
      typeUrl: '/xmtp.xmtp.MsgCreateContact',
      value: MsgCreateContact.fromPartial(data),
    }),
  }
}

interface QueryClientOptions {
  addr: string
}

const queryClient = async (
  { addr }: QueryClientOptions = { addr: 'http://localhost:1317' }
) => {
  return new Api({ baseUrl: addr })
}

export { txClient, queryClient }
