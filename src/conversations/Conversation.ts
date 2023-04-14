import {
  buildUserIntroTopic,
  buildDirectMessageTopic,
  dateToNs,
  concat,
  b64Decode,
  toNanoString,
} from '../utils'
import { utils } from 'ethers'
import Stream from '../Stream'
import Client, {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
  SendOptions,
} from '../Client'
import { InvitationContext } from '../Invitation'
import { DecodedMessage, MessageV1, MessageV2, decodeContent } from '../Message'
import {
  messageApi,
  message,
  content as proto,
  keystore,
  ciphertext,
} from '@xmtp/proto'
import {
  SignedPublicKey,
  Signature,
  PublicKeyBundle,
  SignedPublicKeyBundle,
} from '../crypto'
import { PreparedMessage } from '../PreparedMessage'
import { sha256 } from '../crypto/encryption'
import { buildDecryptV1Request, getResultOrThrow } from '../utils/keystore'
import { ContentTypeText } from '../codecs/Text'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * Conversation represents either a V1 or V2 conversation with a common set of methods.
 */
export interface Conversation {
  /**
   * The wallet address connected to the client
   */
  clientAddress: string
  /**
   * A unique identifier for a conversation. Each conversation is stored on the network on one topic
   */
  topic: string
  /**
   * A unique identifier for ephemeral envelopes for a conversation.
   */
  ephemeralTopic: string
  /**
   * The wallet address of the other party in the conversation
   */
  peerAddress: string
  /**
   * Timestamp the conversation was created at
   */
  createdAt: Date
  /**
   * Optional field containing the `conversationId` and `metadata` for V2 conversations.
   * Will always be undefined on V1 conversations
   */
  context?: InvitationContext | undefined

  /**
   * Retrieve messages in this conversation. Default to returning all messages.
   *
   * If only a subset is required, results can be narrowed by specifying a start/end
   * timestamp.
   *
   * ```ts
   * // Get all messages in the past 24 hours
   * const messages = await conversation.messages({
   *    startTime: new Date(+new Date() - 86_400)
   * })
   * ```
   */
  messages(opts?: ListMessagesOptions): Promise<DecodedMessage[]>
  /**
   * @deprecated
   */
  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<DecodedMessage[]>
  /**
   * Takes a XMTP envelope as input and will decrypt and decode it
   * returning a `DecodedMessage` instance.
   */
  decodeMessage(env: messageApi.Envelope): Promise<DecodedMessage>
  /**
   * Return a `Stream` of new messages in this conversation.
   *
   * Stream instances are async generators and can be used in
   * `for await` statements.
   *
   * ```ts
   * for await (const message of await conversation.stream()) {
   *    console.log(message.content)
   * }
   * ```
   */
  streamMessages(): Promise<Stream<DecodedMessage>>
  /**
   * Send a message into the conversation
   *
   * ## Example
   * ```ts
   * await conversation.send('Hello world') // returns a `DecodedMessage` instance
   * ```
   */
  send(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<DecodedMessage>

  /**
   * Return a `PreparedMessage` that has contains the message ID
   * of the message that will be sent.
   */
  prepareMessage(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<PreparedMessage>

  /**
   * Return a `Stream` of new ephemeral messages from this conversation's
   * ephemeral topic.
   *
   * Stream instances are async generators and can be used in
   * `for await` statements.
   *
   * ```ts
   * for await (const message of await conversation.streamEphemeral()) {
   *    console.log(message.content)
   * }
   * ```
   */
  streamEphemeral(): Promise<Stream<DecodedMessage>>
}

/**
 * ConversationV1 allows you to view, stream, and send messages to/from a peer address
 */
export class ConversationV1 implements Conversation {
  peerAddress: string
  createdAt: Date
  context = undefined
  private client: Client

  constructor(client: Client, address: string, createdAt: Date) {
    this.peerAddress = utils.getAddress(address)
    this.client = client
    this.createdAt = createdAt
  }

  get clientAddress() {
    return this.client.address
  }

  get topic(): string {
    return buildDirectMessageTopic(this.peerAddress, this.client.address)
  }

  get ephemeralTopic(): string {
    return buildDirectMessageTopic(
      this.peerAddress,
      this.client.address
    ).replace('/xmtp/0/dm-', '/xmtp/0/dmE-')
  }

  /**
   * Returns a list of all messages to/from the peerAddress
   */
  async messages(opts?: ListMessagesOptions): Promise<DecodedMessage[]> {
    const topic = buildDirectMessageTopic(this.peerAddress, this.client.address)
    const messages = await this.client.listEnvelopes(
      topic,
      this.processEnvelope.bind(this),
      opts
    )

    return this.decryptBatch(messages, topic, false)
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<DecodedMessage[]> {
    return this.client.listEnvelopesPaginated(
      this.topic,
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
    const msg = await this.processEnvelope(env)
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
    const payload = await this.client.encodeContent(content, options)
    const msg = await this.createMessage(payload, recipient, options?.timestamp)

    const env: messageApi.Envelope = {
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

  async processEnvelope({
    message,
    contentTopic,
  }: messageApi.Envelope): Promise<MessageV1> {
    const messageBytes = b64Decode(message as unknown as string)
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

  streamEphemeral(): Promise<Stream<DecodedMessage>> {
    return Stream.create<DecodedMessage>(
      this.client,
      [this.ephemeralTopic],
      this.decodeMessage.bind(this)
    )
  }

  /**
   * Send a message into the conversation.
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

    const topic = options?.ephemeral ? this.ephemeralTopic : this.topic

    if (!this.client.contacts.has(this.peerAddress)) {
      topics = [
        buildUserIntroTopic(this.peerAddress),
        buildUserIntroTopic(this.client.address),
        topic,
      ]
      this.client.contacts.add(this.peerAddress)
    } else {
      topics = [this.topic]
    }
    const contentType = options?.contentType || ContentTypeText
    const payload = await this.client.encodeContent(content, options)
    const msg = await this.createMessage(payload, recipient, options?.timestamp)

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
      payload,
      topics[0], // Just use the first topic for the returned value
      this
    )
  }

  async decryptBatch(
    messages: MessageV1[],
    topic: string,
    throwOnError = false
  ): Promise<DecodedMessage[]> {
    const responses = (
      await this.client.keystore.decryptV1(
        buildDecryptV1Request(messages, this.client.publicKeyBundle)
      )
    ).responses

    const out: DecodedMessage[] = []
    for (let i = 0; i < responses.length; i++) {
      const result = responses[i]
      const message = messages[i]
      try {
        const { decrypted } = getResultOrThrow(result)
        out.push(await this.buildDecodedMessage(message, decrypted, topic))
      } catch (e) {
        if (throwOnError) {
          throw e
        }
        console.warn('Error decoding content', e)
      }
    }

    return out
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
      decrypted,
      topic,
      this,
      error
    )
  }

  async createMessage(
    // Payload is expected to be the output of `client.encodeContent`
    payload: Uint8Array,
    recipient: PublicKeyBundle,
    timestamp?: Date
  ): Promise<MessageV1> {
    timestamp = timestamp || new Date()

    return MessageV1.encode(
      this.client.keystore,
      payload,
      this.client.publicKeyBundle,
      recipient,
      timestamp
    )
  }
}

/**
 * ConversationV2
 */
export class ConversationV2 implements Conversation {
  client: Client
  topic: string
  peerAddress: string
  createdAt: Date
  context?: InvitationContext

  constructor(
    client: Client,
    topic: string,
    peerAddress: string,
    createdAt: Date,
    context: InvitationContext | undefined
  ) {
    this.topic = topic
    this.createdAt = createdAt
    this.context = context
    this.client = client
    this.peerAddress = peerAddress
  }

  get clientAddress() {
    return this.client.address
  }

  /**
   * Returns a list of all messages to/from the peerAddress
   */
  async messages(opts?: ListMessagesOptions): Promise<DecodedMessage[]> {
    const messages = await this.client.listEnvelopes(
      this.topic,
      this.processEnvelope.bind(this),
      opts
    )

    return this.decryptBatch(messages, false)
  }

  messagesPaginated(
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<DecodedMessage[]> {
    return this.client.listEnvelopesPaginated(
      this.topic,
      this.decodeMessage.bind(this),
      opts
    )
  }

  get ephemeralTopic(): string {
    return this.topic.replace('/xmtp/0/m', '/xmtp/0/mE')
  }

  streamEphemeral(): Promise<Stream<DecodedMessage>> {
    return Stream.create<DecodedMessage>(
      this.client,
      [this.ephemeralTopic],
      this.decodeMessage.bind(this)
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
    const payload = await this.client.encodeContent(content, options)
    const msg = await this.createMessage(payload, options?.timestamp)

    let topic: string
    if (options?.ephemeral) {
      topic = this.ephemeralTopic
    } else {
      topic = this.topic
    }

    await this.client.publishEnvelopes([
      {
        contentTopic: topic,
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
      payload,
      this,
      this.client.address
    )
  }

  async createMessage(
    // Payload is expected to have already gone through `client.encodeContent`
    payload: Uint8Array,
    timestamp?: Date
  ): Promise<MessageV2> {
    const header: message.MessageHeaderV2 = {
      topic: this.topic,
      createdNs: dateToNs(timestamp || new Date()),
    }
    const headerBytes = message.MessageHeaderV2.encode(header).finish()
    const digest = await sha256(concat(headerBytes, payload))
    const signed = {
      payload,
      sender: this.client.signedPublicKeyBundle,
      signature: await this.client.keystore.signDigest({
        digest,
        prekeyIndex: 0,
        identityKey: undefined,
      }),
    }
    const signedBytes = proto.SignedContent.encode(signed).finish()

    const ciphertext = await this.encryptMessage(signedBytes, headerBytes)
    const protoMsg = {
      v1: undefined,
      v2: { headerBytes, ciphertext },
    }
    const bytes = message.Message.encode(protoMsg).finish()

    return MessageV2.create(protoMsg, header, bytes)
  }

  private async decryptBatch(
    messages: MessageV2[],
    throwOnError = false
  ): Promise<DecodedMessage[]> {
    const responses = (
      await this.client.keystore.decryptV2(this.buildDecryptRequest(messages))
    ).responses

    const out: DecodedMessage[] = []
    for (let i = 0; i < responses.length; i++) {
      const result = responses[i]
      const message = messages[i]

      try {
        const { decrypted } = getResultOrThrow(result)
        out.push(await this.buildDecodedMessage(message, decrypted))
      } catch (e) {
        if (throwOnError) {
          throw e
        }
        console.warn('Error decoding content', e)
      }
    }

    return out
  }

  private buildDecryptRequest(
    messages: message.MessageV2[]
  ): keystore.DecryptV2Request {
    return {
      requests: messages.map((m) => {
        return {
          payload: m.ciphertext,
          headerBytes: m.headerBytes,
          contentTopic: this.topic,
        }
      }),
    }
  }

  private async encryptMessage(
    payload: Uint8Array,
    headerBytes: Uint8Array
  ): Promise<ciphertext.Ciphertext> {
    const { responses } = await this.client.keystore.encryptV2({
      requests: [
        {
          payload,
          headerBytes,
          contentTopic: this.topic,
        },
      ],
    })
    if (responses.length !== 1) {
      throw new Error('Invalid response length')
    }
    const { encrypted } = getResultOrThrow(responses[0])
    return encrypted
  }

  private async buildDecodedMessage(
    msg: MessageV2,
    decrypted: Uint8Array
  ): Promise<DecodedMessage> {
    // Decode the decrypted bytes into SignedContent
    const signed = proto.SignedContent.decode(decrypted)
    if (
      !signed.sender?.identityKey ||
      !signed.sender?.preKey ||
      !signed.signature
    ) {
      throw new Error('incomplete signed content')
    }

    await validatePrekeys(signed)

    // Verify the signature
    const digest = await sha256(concat(msg.headerBytes, signed.payload))
    if (
      !new SignedPublicKey(signed.sender?.preKey).verify(
        new Signature(signed.signature),
        digest
      )
    ) {
      throw new Error('invalid signature')
    }

    // Derive the sender address from the valid signature
    const senderAddress = await new SignedPublicKeyBundle(
      signed.sender
    ).walletSignatureAddress()

    const { content, contentType, error } = await decodeContent(
      signed.payload,
      this.client
    )

    return DecodedMessage.fromV2Message(
      msg,
      content,
      contentType,
      this.topic,
      signed.payload,
      this,
      senderAddress,
      error
    )
  }

  async prepareMessage(
    content: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: SendOptions
  ): Promise<PreparedMessage> {
    const payload = await this.client.encodeContent(content, options)
    const msg = await this.createMessage(payload, options?.timestamp)

    const topic = options?.ephemeral ? this.ephemeralTopic : this.topic

    const env: messageApi.Envelope = {
      contentTopic: topic,
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

  async processEnvelope(env: messageApi.Envelope): Promise<MessageV2> {
    if (!env.message || !env.contentTopic) {
      throw new Error('empty envelope')
    }
    const messageBytes = b64Decode(env.message.toString())
    const msg = message.Message.decode(messageBytes)

    if (!msg.v2) {
      throw new Error('unknown message version')
    }

    const header = message.MessageHeaderV2.decode(msg.v2.headerBytes)
    if (header.topic !== this.topic) {
      throw new Error('topic mismatch')
    }

    return MessageV2.create(msg, header, messageBytes)
  }

  async decodeMessage(env: messageApi.Envelope): Promise<DecodedMessage> {
    if (!env.contentTopic) {
      throw new Error('Missing content topic')
    }
    const msg = await this.processEnvelope(env)
    const decryptResults = await this.decryptBatch([msg], true)
    if (!decryptResults.length) {
      throw new Error('No results')
    }
    return decryptResults[0]
  }
}

async function validatePrekeys(signed: proto.SignedContent) {
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
  const isValidPrekey = await new SignedPublicKey(senderIdentityKey).verifyKey(
    new SignedPublicKey(senderPreKey)
  )
  if (!isValidPrekey) {
    throw new Error('pre key not signed by identity key')
  }
}
