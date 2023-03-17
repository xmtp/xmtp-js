import {
  buildUserIntroTopic,
  buildDirectMessageTopic,
  dateToNs,
  concat,
  b64Decode,
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
import { sha256 } from '../crypto/encryption'
import { ContentTypeText } from '../codecs/Text'
import { KeystoreError } from '../keystore'
import {
  buildDecryptV1Request,
  validateKeystoreResponse,
} from '../utils/keystore'

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
      this.processEnvelope.bind(this),
      opts
    )

    return this.decryptBatch(messages, topic, false)
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

  get topic(): string {
    return buildDirectMessageTopic(this.peerAddress, this.client.address)
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

  private async encodeMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    recipient: PublicKeyBundle,
    options?: SendOptions
  ): Promise<MessageV1> {
    const timestamp = options?.timestamp || new Date()
    const payload = await this.client.encodeContent(content, options)

    return MessageV1.encode(
      this.client.keystore,
      payload,
      this.client.publicKeyBundle,
      recipient,
      timestamp
    )
  }

  get clientAddress() {
    return this.client.address
  }
}

export class ConversationV2 {
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
      [this.topic],
      this.processEnvelope.bind(this),
      opts
    )

    return this.decryptBatch(messages, false)
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
      this,
      this.client.address
    )
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
          await this.buildDecodedMessage(message, result.result.decrypted)
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
    validateKeystoreResponse(responses[0])
    const { result } = responses[0]
    if (!result?.encrypted) {
      throw new Error('no result returned')
    }
    return result.encrypted
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
      this,
      senderAddress,
      error
    )
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

export type Conversation = ConversationV1 | ConversationV2
