import { message as proto, type conversationReference } from '@xmtp/proto'
import Long from 'long'
import { PublicKey } from '@/crypto/PublicKey'
import { PublicKeyBundle } from '@/crypto/PublicKeyBundle'
import type Client from './Client'
import {
  ConversationV1,
  ConversationV2,
  type Conversation,
} from './conversations/Conversation'
import Ciphertext from './crypto/Ciphertext'
import { sha256 } from './crypto/encryption'
import { bytesToHex } from './crypto/utils'
import type { KeystoreInterfaces } from './keystore/rpcDefinitions'
import type { ContentTypeId } from './MessageContent'
import { dateToNs, nsToDate } from './utils/date'
import { buildDecryptV1Request, getResultOrThrow } from './utils/keystore'

const headerBytesAndCiphertext = (
  msg: proto.Message
): [Uint8Array, Ciphertext] => {
  if (msg.v1?.ciphertext) {
    return [msg.v1.headerBytes, new Ciphertext(msg.v1.ciphertext)]
  }
  if (msg.v2?.ciphertext) {
    return [msg.v2.headerBytes, new Ciphertext(msg.v2.ciphertext)]
  }
  throw new Error('unknown message version')
}

// Message is basic unit of communication on the network.
// Message timestamp is set by the sender.
class MessageBase {
  headerBytes: Uint8Array // encoded header bytes
  ciphertext: Ciphertext
  // content allows attaching decoded content to the Message
  // the message receiving APIs need to return a Message to provide access to the header fields like sender/recipient
  contentType?: ContentTypeId
  error?: Error
  /**
   * Identifier that is deterministically derived from the bytes of the message
   * header and ciphertext, where all those bytes are authenticated. This can
   * be used in determining uniqueness of messages.
   */
  id: string
  private bytes: Uint8Array

  constructor(id: string, bytes: Uint8Array, obj: proto.Message) {
    ;[this.headerBytes, this.ciphertext] = headerBytesAndCiphertext(obj)
    this.id = id
    this.bytes = bytes
  }

  toBytes(): Uint8Array {
    return this.bytes
  }
}

// Message header carries the sender and recipient keys used to protect message.
// Message timestamp is set by the sender.
export class MessageV1 extends MessageBase implements proto.MessageV1 {
  header: proto.MessageHeaderV1 // eslint-disable-line camelcase
  // wallet address derived from the signature of the message recipient
  senderAddress: string | undefined
  conversation = undefined

  constructor(
    id: string,
    bytes: Uint8Array,
    obj: proto.Message,
    header: proto.MessageHeaderV1,
    senderAddress: string | undefined
  ) {
    super(id, bytes, obj)
    this.senderAddress = senderAddress
    this.header = header
  }

  static async create(
    obj: proto.Message,
    header: proto.MessageHeaderV1,
    bytes: Uint8Array
  ): Promise<MessageV1> {
    if (!header.sender) {
      throw new Error('missing message sender')
    }
    const senderAddress = new PublicKeyBundle(
      header.sender
    ).walletSignatureAddress()
    const id = bytesToHex(await sha256(bytes))
    return new MessageV1(id, bytes, obj, header, senderAddress)
  }

  get sent(): Date {
    return new Date(this.header.timestamp.toNumber())
  }

  // wallet address derived from the signature of the message recipient
  get recipientAddress(): string | undefined {
    if (!this.header?.recipient?.identityKey) {
      return undefined
    }
    return new PublicKey(
      this.header.recipient.identityKey
    ).walletSignatureAddress()
  }

  async decrypt(
    keystore: KeystoreInterfaces,
    myPublicKeyBundle: PublicKeyBundle
  ): Promise<Uint8Array> {
    const responses = (
      await keystore.decryptV1(buildDecryptV1Request([this], myPublicKeyBundle))
    ).responses

    if (!responses.length) {
      throw new Error('No response from Keystore')
    }

    const { decrypted } = getResultOrThrow(responses[0])

    return decrypted
  }

  static fromBytes(bytes: Uint8Array): Promise<MessageV1> {
    const message = proto.Message.decode(bytes)
    const [headerBytes] = headerBytesAndCiphertext(message)
    const header = proto.MessageHeaderV1.decode(headerBytes)
    if (!header) {
      throw new Error('missing message header')
    }
    if (!header.sender) {
      throw new Error('missing message sender')
    }
    if (!header.sender.identityKey) {
      throw new Error('missing message sender identity key')
    }
    if (!header.sender.preKey) {
      throw new Error('missing message sender pre-key')
    }
    if (!header.recipient) {
      throw new Error('missing message recipient')
    }
    if (!header.recipient.identityKey) {
      throw new Error('missing message recipient identity-key')
    }
    if (!header.recipient.preKey) {
      throw new Error('missing message recipient pre-key')
    }

    return MessageV1.create(message, header, bytes)
  }

  static async encode(
    keystore: KeystoreInterfaces,
    payload: Uint8Array,
    sender: PublicKeyBundle,
    recipient: PublicKeyBundle,
    timestamp: Date
  ): Promise<MessageV1> {
    const header: proto.MessageHeaderV1 = {
      sender,
      recipient,
      timestamp: Long.fromNumber(timestamp.getTime()),
    }
    const headerBytes = proto.MessageHeaderV1.encode(header).finish()
    const results = await keystore.encryptV1({
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

    const { encrypted: ciphertext } = getResultOrThrow(results.responses[0])

    const protoMsg = {
      v1: { headerBytes, ciphertext },
      v2: undefined,
    }
    const bytes = proto.Message.encode(protoMsg).finish()
    return MessageV1.create(protoMsg, header, bytes)
  }
}

export class MessageV2 extends MessageBase implements proto.MessageV2 {
  senderAddress: string | undefined
  private header: proto.MessageHeaderV2
  senderHmac?: Uint8Array
  shouldPush?: boolean

  constructor(
    id: string,
    bytes: Uint8Array,
    obj: proto.Message,
    header: proto.MessageHeaderV2,
    senderHmac?: Uint8Array,
    shouldPush?: boolean
  ) {
    super(id, bytes, obj)
    this.header = header
    this.senderHmac = senderHmac
    this.shouldPush = shouldPush
  }

  static async create(
    obj: proto.Message,
    header: proto.MessageHeaderV2,
    bytes: Uint8Array,
    senderHmac?: Uint8Array,
    shouldPush?: boolean
  ): Promise<MessageV2> {
    const id = bytesToHex(await sha256(bytes))

    return new MessageV2(id, bytes, obj, header, senderHmac, shouldPush)
  }

  get sent(): Date {
    return nsToDate(this.header.createdNs)
  }
}

export type Message = MessageV1 | MessageV2

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DecodedMessage<ContentTypes = any> {
  id: string
  messageVersion: 'v1' | 'v2'
  senderAddress: string
  recipientAddress?: string
  sent: Date
  contentTopic: string
  conversation: Conversation<ContentTypes>
  contentType: ContentTypeId
  content: ContentTypes
  error?: Error
  contentBytes: Uint8Array
  contentFallback?: string

  constructor({
    id,
    messageVersion,
    senderAddress,
    recipientAddress,
    conversation,
    contentBytes,
    contentType,
    contentTopic,
    content,
    sent,
    error,
    contentFallback,
  }: Omit<DecodedMessage<ContentTypes>, 'toBytes'>) {
    this.id = id
    this.messageVersion = messageVersion
    this.senderAddress = senderAddress
    this.recipientAddress = recipientAddress
    this.conversation = conversation
    this.contentType = contentType
    this.sent = sent
    this.error = error
    this.content = content
    this.contentTopic = contentTopic
    this.contentBytes = contentBytes
    this.contentFallback = contentFallback
  }

  toBytes(): Uint8Array {
    return proto.DecodedMessage.encode({
      ...this,
      conversation: {
        topic: this.conversation.topic,
        context: this.conversation.context ?? undefined,
        createdNs: dateToNs(this.conversation.createdAt),
        peerAddress: this.conversation.peerAddress,
        consentProofPayload: this.conversation.consentProof ?? undefined,
      },
      sentNs: dateToNs(this.sent),
    }).finish()
  }

  static async fromBytes<ContentTypes>(
    data: Uint8Array,
    client: Client<ContentTypes>
  ): Promise<DecodedMessage<ContentTypes>> {
    const protoVal = proto.DecodedMessage.decode(data)
    const messageVersion = protoVal.messageVersion

    if (messageVersion !== 'v1' && messageVersion !== 'v2') {
      throw new Error('Invalid message version')
    }

    if (!protoVal.conversation) {
      throw new Error('No conversation reference found')
    }

    const { content, contentType, error, contentFallback } =
      await client.decodeContent(protoVal.contentBytes)

    return new DecodedMessage({
      ...protoVal,
      content,
      contentType,
      error,
      messageVersion,
      sent: nsToDate(protoVal.sentNs),
      conversation: conversationReferenceToConversation(
        protoVal.conversation,
        client,
        messageVersion
      ),
      contentFallback,
    })
  }

  static fromV1Message<ContentTypes>(
    message: MessageV1,
    content: ContentTypes,
    contentType: ContentTypeId,
    contentBytes: Uint8Array,
    contentTopic: string,
    conversation: Conversation<ContentTypes>,
    error?: Error,
    contentFallback?: string
  ): DecodedMessage<ContentTypes> {
    const { id, senderAddress, recipientAddress, sent } = message
    if (!senderAddress) {
      throw new Error('Sender address is required')
    }
    return new DecodedMessage({
      id,
      messageVersion: 'v1',
      senderAddress,
      recipientAddress,
      sent,
      content,
      contentBytes,
      contentType,
      contentTopic,
      conversation,
      error,
      contentFallback,
    })
  }

  static fromV2Message<ContentTypes>(
    message: MessageV2,
    content: ContentTypes,
    contentType: ContentTypeId,
    contentTopic: string,
    contentBytes: Uint8Array,
    conversation: Conversation<ContentTypes>,
    senderAddress: string,
    error?: Error,
    contentFallback?: string
  ): DecodedMessage<ContentTypes> {
    const { id, sent } = message

    return new DecodedMessage({
      id,
      messageVersion: 'v2',
      senderAddress,
      sent,
      content,
      contentBytes,
      contentType,
      contentTopic,
      conversation,
      error,
      contentFallback,
    })
  }
}

function conversationReferenceToConversation<ContentTypes>(
  reference: conversationReference.ConversationReference,
  client: Client<ContentTypes>,
  version: DecodedMessage['messageVersion']
): Conversation<ContentTypes> {
  if (version === 'v1') {
    return new ConversationV1(
      client,
      reference.peerAddress,
      nsToDate(reference.createdNs)
    )
  }
  if (version === 'v2') {
    return new ConversationV2(
      client,
      reference.topic,
      reference.peerAddress,
      nsToDate(reference.createdNs),
      reference.context,
      reference.consentProofPayload
    )
  }
  throw new Error(`Unknown conversation version ${version}`)
}

export function decodeContent<ContentTypes>(
  contentBytes: Uint8Array,
  client: Client<ContentTypes>
) {
  return client.decodeContent(contentBytes)
}
