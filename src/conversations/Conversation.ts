import {
  buildUserIntroTopic,
  buildDirectMessageTopic,
  dateToNs,
  nsToDate,
  toNanoString,
} from '../utils'
import { utils } from 'ethers'
import { DecodedMessage } from './../Message'
import Stream from '../Stream'
import Client, {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
  SendOptions,
} from '../Client'
import {
  InvitationContext,
  InvitationV1,
  SealedInvitationHeaderV1,
} from '../Invitation'
import { MessageV1, MessageV2, decodeContent } from '../Message'
import {
  messageApi,
  message,
  content as proto,
  fetcher,
  keystore,
} from '@xmtp/proto'
import {
  encrypt,
  decrypt,
  SignedPublicKey,
  Signature,
  PublicKeyBundle,
} from '../crypto'
import { PreparedMessage } from '../PreparedMessage'
import Ciphertext from '../crypto/Ciphertext'
import { sha256 } from '../crypto/encryption'
import { ContentTypeText } from '../codecs/Text'
import { KeystoreError } from '../keystore'
import Long from 'long'
import { Envelope } from '@xmtp/proto/ts/dist/types/message_api/v1/message_api.pb'
const { b64Decode } = fetcher

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

type ConversationV1Export = {
  version: 'v1'
  peerAddress: string
  createdAt: string
}

type ConversationV2Export = {
  version: 'v2'
  topic: string
  keyMaterial: string
  createdAt: string
  peerAddress: string
  context: InvitationContext | undefined
}

export type ConversationExport = ConversationV1Export | ConversationV2Export

/**
 * Conversation class allows you to view, stream, and send messages to/from a peer address
 */
export class ConversationV1 {
  peerAddress: string
  createdAt: Date
  context = null
  private client: Client

  constructor(client: Client, address: string, createdAt: Date) {
    this.peerAddress = utils.getAddress(address)
    this.client = client
    this.createdAt = createdAt
  }

  /**
   * Returns a list of all messages to/from the peerAddress
   */
  async messages(opts?: ListMessagesOptions): Promise<DecodedMessage[]> {
    const topic = buildDirectMessageTopic(this.peerAddress, this.client.address)
    const messages = await this.client.listEnvelopes(
      [topic],
      this.decodeEnvelope.bind(this),
      opts
    )

    return this.decryptBatch(messages, topic, false)
  }

  async decryptBatch(
    messages: MessageV1[],
    topic: string,
    throwOnError = false
  ): Promise<DecodedMessage[]> {
    const responses = (
      await this.client.keystore.decryptV1(this.buildDecryptRequest(messages))
    ).responses

    const out: DecodedMessage[] = []
    for (let i = 0; i < responses.length; i++) {
      const result = responses[i]
      const message = messages[i]
      if (result.error) {
        console.warn('Error decrypting message', result.error)
        if (throwOnError) {
          throw new KeystoreError(result.error?.code, result.error?.message)
        }
        continue
      }

      if (!result.result?.decrypted) {
        console.warn('Error decrypting message', result)
        if (throwOnError) {
          throw new KeystoreError(
            keystore.ErrorCode.ERROR_CODE_UNSPECIFIED,
            'No result returned'
          )
        }
        continue
      }

      try {
        out.push(
          await this.buildDecodedMessage(
            message,
            result.result.decrypted,
            topic
          )
        )
      } catch (e) {
        console.warn('Error decoding content', e)
        if (throwOnError) {
          throw e
        }
      }
    }

    return out
  }

  private buildDecryptRequest(
    messages: MessageV1[]
  ): keystore.DecryptV1Request {
    return {
      requests: messages.map((m: MessageV1) => {
        const sender = new PublicKeyBundle({
          identityKey: m.header.sender?.identityKey,
          preKey: m.header.sender?.preKey,
        })

        const isSender = this.client.publicKeyBundle.equals(sender)

        return {
          payload: m.ciphertext,
          peerKeys: isSender
            ? new PublicKeyBundle({
                identityKey: m.header.recipient?.identityKey,
                preKey: m.header.recipient?.preKey,
              })
            : sender,
          headerBytes: m.headerBytes,
          isSender,
        }
      }),
    }
  }

  private async buildDecodedMessage(
    message: MessageV1,
    decrypted: Uint8Array,
    topic: string
  ): Promise<DecodedMessage> {
    const { content, contentType, error } = await decodeContent(
      decrypted,
      this.client
    )
    return DecodedMessage.fromV1Message(
      message,
      content,
      contentType,
      topic,
      this,
      error
    )
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<DecodedMessage[]> {
    return this.client.listEnvelopesPaginated(
      [this.topic],
      // This won't be performant once we start supporting a remote keystore
      // TODO: Either better batch support or we ditch this under-utilized feature
      this.decodeMessage.bind(this),
      opts
    )
  }

  // decodeMessage takes an envelope and either returns a `DecodedMessage` or throws if an error occurs
  async decodeMessage(env: messageApi.Envelope): Promise<DecodedMessage> {
    if (!env.contentTopic) {
      throw new Error('Missing content topic')
    }
    const msg = await this.decodeEnvelope(env)
    const decryptResults = await this.decryptBatch(
      [msg],
      env.contentTopic,
      true
    )
    if (!decryptResults.length) {
      throw new Error('No results')
    }
    return decryptResults[0]
  }

  get topic(): string {
    return buildDirectMessageTopic(this.peerAddress, this.client.address)
  }

  async prepareMessage(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<PreparedMessage> {
    let topics: string[]
    let recipient = await this.client.getUserContact(this.peerAddress)
    if (!recipient) {
      throw new Error(`recipient ${this.peerAddress} is not registered`)
    }
    if (!(recipient instanceof PublicKeyBundle)) {
      recipient = recipient.toLegacyBundle()
    }

    if (!this.client.contacts.has(this.peerAddress)) {
      topics = [
        buildUserIntroTopic(this.peerAddress),
        buildUserIntroTopic(this.client.address),
        this.topic,
      ]
      this.client.contacts.add(this.peerAddress)
    } else {
      topics = [this.topic]
    }

    const msg = await this.encodeMessage(content, recipient, options)

    const env: Envelope = {
      contentTopic: this.topic,
      message: msg.toBytes(),
      timestampNs: toNanoString(msg.sent),
    }

    return new PreparedMessage(env, async () => {
      await this.client.publishEnvelopes(
        topics.map((topic) => ({
          contentTopic: topic,
          message: msg.toBytes(),
          timestamp: msg.sent,
        }))
      )
    })
  }

  /**
   * Returns a Stream of any new messages to/from the peerAddress
   */
  streamMessages(): Promise<Stream<DecodedMessage>> {
    return Stream.create<DecodedMessage>(
      this.client,
      [this.topic],
      async (env: messageApi.Envelope) => this.decodeMessage(env)
    )
  }

  export(): ConversationV1Export {
    return {
      version: 'v1',
      peerAddress: this.peerAddress,
      createdAt: this.createdAt.toISOString(),
    }
  }

  static fromExport(
    client: Client,
    data: ConversationV1Export
  ): ConversationV1 {
    return new ConversationV1(
      client,
      data.peerAddress,
      new Date(data.createdAt)
    )
  }

  async decodeEnvelope({
    message,
    contentTopic,
  }: messageApi.Envelope): Promise<MessageV1> {
    const messageBytes = fetcher.b64Decode(message as unknown as string)
    const decoded = await MessageV1.fromBytes(messageBytes)
    const { senderAddress, recipientAddress } = decoded

    // Filter for topics
    if (
      !senderAddress ||
      !recipientAddress ||
      !contentTopic ||
      buildDirectMessageTopic(senderAddress, recipientAddress) !== this.topic
    ) {
      throw new Error('Headers do not match intended recipient')
    }

    return decoded
  }

  /**
   * Send a message into the conversation
   */
  async send(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<DecodedMessage> {
    let topics: string[]
    let recipient = await this.client.getUserContact(this.peerAddress)
    if (!recipient) {
      throw new Error(`recipient ${this.peerAddress} is not registered`)
    }
    if (!(recipient instanceof PublicKeyBundle)) {
      recipient = recipient.toLegacyBundle()
    }

    if (!this.client.contacts.has(this.peerAddress)) {
      topics = [
        buildUserIntroTopic(this.peerAddress),
        buildUserIntroTopic(this.client.address),
        this.topic,
      ]
      this.client.contacts.add(this.peerAddress)
    } else {
      topics = [this.topic]
    }
    const contentType = options?.contentType || ContentTypeText
    const msg = await this.encodeMessage(content, recipient, options)

    await this.client.publishEnvelopes(
      topics.map((topic) => ({
        contentTopic: topic,
        message: msg.toBytes(),
        timestamp: msg.sent,
      }))
    )

    return DecodedMessage.fromV1Message(
      msg,
      content,
      contentType,
      topics[0], // Just use the first topic for the returned value
      this
    )
  }

  private async encodeMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    recipient: PublicKeyBundle,
    options?: SendOptions
  ): Promise<MessageV1> {
    const timestamp = options?.timestamp || new Date()
    const payload = await this.client.encodeContent(content, options)
    const header: message.MessageHeaderV1 = {
      sender: this.client.publicKeyBundle,
      recipient,
      timestamp: Long.fromNumber(timestamp.getTime()),
    }
    const headerBytes = message.MessageHeaderV1.encode(header).finish()
    const results = await this.client.keystore.encryptV1({
      requests: [
        {
          recipient,
          headerBytes,
          payload,
        },
      ],
    })

    if (!results.responses.length) {
      throw new Error('No response from Keystore')
    }

    const response = results.responses[0]
    this.validateKeystoreResponse(response)

    const ciphertext = response.result?.encrypted
    const protoMsg = {
      v1: { headerBytes, ciphertext },
      v2: undefined,
    }
    const bytes = message.Message.encode(protoMsg).finish()
    return MessageV1.create(protoMsg, header, bytes)
  }

  private validateKeystoreResponse(
    response:
      | keystore.DecryptResponse_Response
      | keystore.EncryptResponse_Response
  ) {
    if (response.error) {
      throw new KeystoreError(response.error.code, response.error.message)
    }
    if (!response.result) {
      throw new KeystoreError(
        keystore.ErrorCode.ERROR_CODE_UNSPECIFIED,
        'No result from Keystore'
      )
    }
  }

  get clientAddress() {
    return this.client.address
  }
}

export class ConversationV2 {
  topic: string
  private keyMaterial: Uint8Array // MUST be kept secret
  context?: InvitationContext
  private client: Client
  createdAt: Date
  peerAddress: string

  constructor(
    client: Client,
    topic: string,
    keyMaterial: Uint8Array,
    peerAddress: string,
    createdAt: Date,
    context: InvitationContext | undefined
  ) {
    this.topic = topic
    this.keyMaterial = keyMaterial
    this.createdAt = createdAt
    this.context = context
    this.client = client
    this.peerAddress = peerAddress
  }

  static async create(
    client: Client,
    invitation: InvitationV1,
    header: SealedInvitationHeaderV1
  ): Promise<ConversationV2> {
    const myKeys = client.keys.getPublicKeyBundle()
    const peer = myKeys.equals(header.sender) ? header.recipient : header.sender
    const peerAddress = utils.getAddress(await peer.walletSignatureAddress())
    return new ConversationV2(
      client,
      invitation.topic,
      invitation.aes256GcmHkdfSha256.keyMaterial,
      peerAddress,
      nsToDate(header.createdNs),
      invitation.context
    )
  }

  /**
   * Returns a list of all messages to/from the peerAddress
   */
  async messages(opts?: ListMessagesOptions): Promise<DecodedMessage[]> {
    return this.client.listEnvelopes(
      [this.topic],
      this.decodeMessage.bind(this),
      opts
    )
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<DecodedMessage[]> {
    return this.client.listEnvelopesPaginated(
      [this.topic],
      this.decodeMessage.bind(this),
      opts
    )
  }

  /**
   * Returns a Stream of any new messages to/from the peerAddress
   */
  streamMessages(): Promise<Stream<DecodedMessage>> {
    return Stream.create<DecodedMessage>(
      this.client,
      [this.topic],
      this.decodeMessage.bind(this)
    )
  }

  /**
   * Send a message into the conversation
   */
  async send(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<DecodedMessage> {
    const msg = await this.encodeMessage(content, options)
    await this.client.publishEnvelopes([
      {
        contentTopic: this.topic,
        message: msg.toBytes(),
        timestamp: msg.sent,
      },
    ])
    const contentType = options?.contentType || ContentTypeText

    return DecodedMessage.fromV2Message(
      msg,
      content,
      contentType,
      this.topic,
      this
    )
  }

  get clientAddress() {
    return this.client.address
  }

  async encodeMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    options?: SendOptions
  ): Promise<MessageV2> {
    const payload = await this.client.encodeContent(content, options)
    const header: message.MessageHeaderV2 = {
      topic: this.topic,
      createdNs: dateToNs(options?.timestamp || new Date()),
    }
    const headerBytes = message.MessageHeaderV2.encode(header).finish()
    const digest = await sha256(concat(headerBytes, payload))
    const signed = {
      payload,
      sender: this.client.keys.getPublicKeyBundle(),
      signature: await this.client.keys.getCurrentPreKey().sign(digest),
    }
    const signedBytes = proto.SignedContent.encode(signed).finish()
    const ciphertext = await encrypt(signedBytes, this.keyMaterial, headerBytes)
    const protoMsg = {
      v1: undefined,
      v2: { headerBytes, ciphertext },
    }
    const bytes = message.Message.encode(protoMsg).finish()
    return MessageV2.create(protoMsg, header, signed, bytes)
  }

  async decodeMessage(env: messageApi.Envelope): Promise<DecodedMessage> {
    if (!env.message || !env.contentTopic) {
      throw new Error('empty envelope')
    }
    const messageBytes = b64Decode(env.message.toString())
    const msg = message.Message.decode(messageBytes)
    if (!msg.v2) {
      throw new Error('unknown message version')
    }
    const msgv2 = msg.v2
    const header = message.MessageHeaderV2.decode(msgv2.headerBytes)
    if (header.topic !== this.topic) {
      throw new Error('topic mismatch')
    }
    if (!msgv2.ciphertext) {
      throw new Error('missing ciphertext')
    }
    const decrypted = await decrypt(
      new Ciphertext(msgv2.ciphertext),
      this.keyMaterial,
      msgv2.headerBytes
    )
    const signed = proto.SignedContent.decode(decrypted)
    if (
      !signed.sender?.identityKey ||
      !signed.sender?.preKey ||
      !signed.signature
    ) {
      throw new Error('incomplete signed content')
    }

    // Check that the pre key is signed by the identity key
    // this is required to chain the prekey-signed message to the identity key
    // and finally to the user's wallet address
    const senderPreKey = signed.sender?.preKey
    if (!senderPreKey || !senderPreKey.signature || !senderPreKey.keyBytes) {
      throw new Error('missing pre-key or pre-key signature')
    }
    const senderIdentityKey = signed.sender?.identityKey
    if (!senderIdentityKey) {
      throw new Error('missing identity key in bundle')
    }
    const isValidPrekey = await new SignedPublicKey(
      senderIdentityKey
    ).verifyKey(new SignedPublicKey(senderPreKey))
    if (!isValidPrekey) {
      throw new Error('pre key not signed by identity key')
    }

    const digest = await sha256(concat(msgv2.headerBytes, signed.payload))
    if (
      !new SignedPublicKey(signed.sender?.preKey).verify(
        new Signature(signed.signature),
        digest
      )
    ) {
      throw new Error('invalid signature')
    }
    const messageV2 = await MessageV2.create(msg, header, signed, messageBytes)
    const { content, contentType, error } = await decodeContent(
      signed.payload,
      this.client
    )

    return DecodedMessage.fromV2Message(
      messageV2,
      content,
      contentType,
      env.contentTopic,
      this,
      error
    )
  }

  async prepareMessage(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<PreparedMessage> {
    const msg = await this.encodeMessage(content, options)

    const env: Envelope = {
      contentTopic: this.topic,
      message: msg.toBytes(),
      timestampNs: toNanoString(msg.sent),
    }

    return new PreparedMessage(env, async () => {
      await this.client.publishEnvelopes([
        {
          contentTopic: this.topic,
          message: msg.toBytes(),
          timestamp: msg.sent,
        },
      ])
    })
  }

  export(): ConversationV2Export {
    return {
      version: 'v2',
      topic: this.topic,
      keyMaterial: Buffer.from(this.keyMaterial).toString('base64'),
      peerAddress: this.peerAddress,
      createdAt: this.createdAt.toISOString(),
      context: this.context,
    }
  }

  static fromExport(
    client: Client,
    data: ConversationV2Export
  ): ConversationV2 {
    return new ConversationV2(
      client,
      data.topic,
      Buffer.from(data.keyMaterial, 'base64'),
      data.peerAddress,
      new Date(data.createdAt),
      data.context
    )
  }
}

export type Conversation = ConversationV1 | ConversationV2

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const ab = new Uint8Array(a.length + b.length)
  ab.set(a)
  ab.set(b, a.length)
  return ab
}
