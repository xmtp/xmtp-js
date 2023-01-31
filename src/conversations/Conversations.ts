import { ListMessagesOptions } from './../Client'
import { Mutex } from 'async-mutex'
import { SignedPublicKeyBundle } from './../crypto/PublicKeyBundle'
import { InvitationContext } from './../Invitation'
import {
  Conversation,
  ConversationV1,
  ConversationV2,
  ConversationExport,
} from './Conversation'
import { MessageV1, DecodedMessage } from '../Message'
import Stream from '../Stream'
import Client from '../Client'
import { buildUserIntroTopic, buildUserInviteTopic } from '../utils'
import { SealedInvitation, InvitationV1 } from '../Invitation'
import { PublicKeyBundle } from '../crypto'
import { messageApi, fetcher } from '@xmtp/proto'
import { SortDirection } from '../ApiClient'
const { b64Decode } = fetcher

const CLOCK_SKEW_OFFSET_MS = 10000

const messageHasHeaders = (msg: MessageV1): boolean => {
  return Boolean(msg.recipientAddress && msg.senderAddress)
}

type CacheLoader = (args: {
  latestSeen: Date | undefined
  existing: Conversation[]
}) => Promise<Conversation[]>

export class ConversationCache {
  private conversations: Conversation[]
  private mutex: Mutex
  private latestSeen?: Date
  private seenTopics: Set<string>

  constructor() {
    this.conversations = []
    this.mutex = new Mutex()
    this.seenTopics = new Set()
  }

  async load(loader: CacheLoader) {
    const release = await this.mutex.acquire()
    try {
      const newConvos = await loader({
        latestSeen: this.latestSeen,
        existing: this.conversations,
      })
      for (const convo of newConvos) {
        if (!this.seenTopics.has(convo.topic)) {
          this.seenTopics.add(convo.topic)
          this.conversations.push(convo)
          if (!this.latestSeen || convo.createdAt > this.latestSeen) {
            this.latestSeen = convo.createdAt
          }
        }
      }
      // No catch block so that errors still bubble
    } finally {
      release()
    }

    return [...this.conversations]
  }
}

/**
 * Conversations allows you to view ongoing 1:1 messaging sessions with another wallet
 */
export default class Conversations {
  private client: Client
  private v1Cache: ConversationCache
  private v2Cache: ConversationCache

  constructor(client: Client) {
    this.client = client
    this.v1Cache = new ConversationCache()
    this.v2Cache = new ConversationCache()
  }

  /**
   * List all conversations with the current wallet found in the network, deduped by peer address
   */
  async list(): Promise<Conversation[]> {
    const [v1Convos, v2Convos] = await Promise.all([
      this.listV1Conversations(),
      this.listV2Conversations(),
    ])

    const conversations = v1Convos.concat(v2Convos)

    conversations.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    return conversations
  }

  private async listV1Conversations(): Promise<Conversation[]> {
    return this.v1Cache.load(async ({ latestSeen }) => {
      const seenPeers = await this.getIntroductionPeers({
        startTime: latestSeen
          ? new Date(+latestSeen - CLOCK_SKEW_OFFSET_MS)
          : undefined,
        direction: SortDirection.SORT_DIRECTION_ASCENDING,
      })

      return Array.from(seenPeers).map(
        ([peerAddress, sent]) =>
          new ConversationV1(this.client, peerAddress, sent)
      )
    })
  }

  private async listV2Conversations(): Promise<Conversation[]> {
    return this.v2Cache.load(async ({ latestSeen }) =>
      this.v2ConversationLoader(latestSeen)
    )
  }

  // Callback called in listV2Conversations and in newConversation
  private async v2ConversationLoader(
    latestSeen: Date | undefined
  ): Promise<Conversation[]> {
    const newConvos: Conversation[] = []
    const invites = await this.client.listInvitations({
      startTime: latestSeen
        ? new Date(+latestSeen - CLOCK_SKEW_OFFSET_MS)
        : undefined,
      direction: SortDirection.SORT_DIRECTION_ASCENDING,
    })

    for (const sealed of invites) {
      try {
        const unsealed = await sealed.v1.getInvitation(this.client.keys)
        newConvos.push(
          await ConversationV2.create(this.client, unsealed, sealed.v1.header)
        )
      } catch (e) {
        console.warn('Error decrypting invitation', e)
      }
    }

    return newConvos
  }

  /**
   * Returns a stream of any newly created conversations.
   * Will dedupe to not return the same conversation twice in the same stream.
   * Does not dedupe any other previously seen conversations
   */
  async stream(): Promise<Stream<Conversation>> {
    const seenPeers: Set<string> = new Set()
    const introTopic = buildUserIntroTopic(this.client.address)
    const inviteTopic = buildUserInviteTopic(this.client.address)

    const newPeer = (peerAddress: string): boolean => {
      // Check if we have seen the peer already in this stream
      if (seenPeers.has(peerAddress)) {
        return false
      }
      seenPeers.add(peerAddress)
      return true
    }

    const decodeConversation = async (env: messageApi.Envelope) => {
      if (env.contentTopic === introTopic) {
        const messageBytes = b64Decode(env.message as unknown as string)
        const msg = await MessageV1.fromBytes(messageBytes)
        await msg.decrypt(this.client.legacyKeys)
        const peerAddress = this.getPeerAddress(msg)
        if (!newPeer(peerAddress)) {
          return undefined
        }
        return new ConversationV1(this.client, peerAddress, msg.sent)
      }
      if (env.contentTopic === inviteTopic) {
        const sealed = await SealedInvitation.fromEnvelope(env)
        const unsealed = await sealed.v1.getInvitation(this.client.keys)
        return await ConversationV2.create(
          this.client,
          unsealed,
          sealed.v1.header
        )
      }
      throw new Error('unrecognized invite topic')
    }

    return Stream.create<Conversation>(
      this.client,
      [inviteTopic, introTopic],
      decodeConversation.bind(this)
    )
  }

  /**
   * Streams messages from all conversations.
   *
   * When a new conversation is initiated with the client's address, this function will automatically register it and add it to the list of conversations to watch.
   * Callers should be aware the first messages in a newly created conversation are picked up on a best effort basis and there are other potential race conditions which may cause some newly created conversations to be missed.
   *
   */
  async streamAllMessages(): Promise<AsyncGenerator<DecodedMessage>> {
    const introTopic = buildUserIntroTopic(this.client.address)
    const inviteTopic = buildUserInviteTopic(this.client.address)
    const topics = new Set<string>([introTopic, inviteTopic])
    const convoMap = new Map<string, Conversation>()

    for (const conversation of await this.list()) {
      topics.add(conversation.topic)
      convoMap.set(conversation.topic, conversation)
    }

    const decodeMessage = async (
      env: messageApi.Envelope
    ): Promise<Conversation | DecodedMessage | null> => {
      const contentTopic = env.contentTopic
      if (!contentTopic) {
        return null
      }

      if (contentTopic === introTopic) {
        const messageBytes = b64Decode(env.message as unknown as string)
        const msg = await MessageV1.fromBytes(messageBytes)
        if (!messageHasHeaders(msg)) {
          return null
        }
        // Decrypt the message to ensure it hasn't been spoofed
        await msg.decrypt(this.client.legacyKeys)
        const peerAddress =
          msg.senderAddress === this.client.address
            ? msg.recipientAddress
            : msg.senderAddress

        // Temporarily create a convo to decrypt the message
        const convo = new ConversationV1(
          this.client,
          peerAddress as string,
          msg.sent
        )

        return convo.decodeMessage(env)
      }

      // Decode as an invite and return the envelope
      // This gives the contentTopicUpdater everything it needs to add to the topic list
      if (contentTopic === inviteTopic) {
        const sealed = await SealedInvitation.fromEnvelope(env)
        const unsealed = await sealed.v1.getInvitation(this.client.keys)
        return ConversationV2.create(this.client, unsealed, sealed.v1.header)
      }

      const convo = convoMap.get(contentTopic)

      // Decode as a V1 message if the topic matches a V1 convo
      if (convo instanceof ConversationV1) {
        return convo.decodeMessage(env)
      }

      // Decode as a V2 message if the topic matches a V2 convo
      if (convo instanceof ConversationV2) {
        return convo.decodeMessage(env)
      }

      console.log('Unknown topic')

      throw new Error('Unknown topic')
    }

    const addConvo = (topic: string, conversation: Conversation): boolean => {
      if (topics.has(topic)) {
        return false
      }
      convoMap.set(topic, conversation)
      topics.add(topic)
      return true
    }

    const contentTopicUpdater = (msg: Conversation | DecodedMessage | null) => {
      // If we have a V1 message from the introTopic, store the conversation in our mapping
      if (msg instanceof DecodedMessage && msg.contentTopic === introTopic) {
        const convo = new ConversationV1(
          this.client,
          msg.recipientAddress === this.client.address
            ? (msg.senderAddress as string)
            : (msg.recipientAddress as string),
          msg.sent
        )
        const isNew = addConvo(convo.topic, convo)

        return isNew ? Array.from(topics.values()) : undefined
      }

      if (msg instanceof ConversationV2) {
        const isNew = addConvo(msg.topic, msg)

        return isNew ? Array.from(topics.values()) : undefined
      }

      return undefined
    }

    const str = await Stream.create<DecodedMessage | Conversation | null>(
      this.client,
      Array.from(topics.values()),
      decodeMessage,
      contentTopicUpdater
    )

    return (async function* generate() {
      for await (const val of str) {
        if (val instanceof DecodedMessage) {
          yield val
        }
        // For conversation V2, we may have messages in the new topic before we started streaming.
        // To be safe, we fetch all messages
        if (val instanceof ConversationV2) {
          for (const convoMessage of await val.messages()) {
            yield convoMessage
          }
        }
      }
    })()
  }

  private async getIntroductionPeers(
    opts?: ListMessagesOptions
  ): Promise<Map<string, Date>> {
    const messages = await this.client.listEnvelopes(
      [buildUserIntroTopic(this.client.address)],
      async (env) => {
        const msg = await MessageV1.fromBytes(
          b64Decode(env.message as unknown as string)
        )

        // Decrypt the message to ensure it is valid. Ignore the contents
        await msg.decrypt(this.client.legacyKeys)
        return msg
      },
      opts
    )
    const seenPeers: Map<string, Date> = new Map()
    for (const message of messages) {
      // Ignore all messages without sender or recipient address headers
      // Makes getPeerAddress safe
      if (!messageHasHeaders(message)) {
        continue
      }

      const peerAddress = this.getPeerAddress(message)

      if (peerAddress) {
        const have = seenPeers.get(peerAddress)
        if (!have || have > message.sent) {
          seenPeers.set(peerAddress, message.sent)
        }
      }
    }

    return seenPeers
  }

  /**
   * Creates a new conversation for the given address. Will throw an error if the peer is not found in the XMTP network
   */
  async newConversation(
    peerAddress: string,
    context?: InvitationContext
  ): Promise<Conversation> {
    let contact = await this.client.getUserContact(peerAddress)
    if (!contact) {
      throw new Error(`Recipient ${peerAddress} is not on the XMTP network`)
    }

    // If this is a V1 conversation continuation
    if (contact instanceof PublicKeyBundle && !context?.conversationId) {
      return new ConversationV1(this.client, peerAddress, new Date())
    }

    // If no conversationId, check and see if we have an existing V1 conversation
    if (!context?.conversationId) {
      const v1Convos = await this.listV1Conversations()
      const matchingConvo = v1Convos.find(
        (convo) => convo.peerAddress === peerAddress
      )
      // If intro already exists, return V1 conversation
      // if both peers have V1 compatible key bundles
      if (matchingConvo) {
        if (!this.client.keys.getPublicKeyBundle().isFromLegacyBundle()) {
          throw new Error(
            'cannot resume pre-existing V1 conversation; client keys not compatible'
          )
        }
        if (
          !(contact instanceof PublicKeyBundle) &&
          !contact.isFromLegacyBundle()
        ) {
          throw new Error(
            'cannot resume pre-existing V1 conversation; peer keys not compatible'
          )
        }
        return matchingConvo
      }
    }

    // Coerce the contact into a V2 bundle
    if (contact instanceof PublicKeyBundle) {
      contact = SignedPublicKeyBundle.fromLegacyBundle(contact)
    }

    // Define a function for matching V2 conversations
    const matcherFn = (convo: Conversation) =>
      convo.peerAddress === peerAddress &&
      isMatchingContext(context, convo.context ?? undefined)

    let v2Convo: Conversation | undefined

    // Perform all read/write operations on the cache while holding the mutex
    await this.v2Cache.load(
      async ({ latestSeen, existing }): Promise<Conversation[]> => {
        // First check the cache without doing a network request
        const existingMatch = existing.find(matcherFn)
        if (existingMatch) {
          v2Convo = existingMatch
          return []
        }

        // Next try and load new items into the cache from the network
        const newItems = await this.v2ConversationLoader(latestSeen)
        const newItemMatch = newItems.find(matcherFn)
        // If one of those matches, return it to update the cache
        if (newItemMatch) {
          v2Convo = newItemMatch
          return newItems
        }

        // If all else fails, create a new invite
        const invitation = InvitationV1.createRandom(context)
        const sealedInvite = await this.sendInvitation(
          contact as SignedPublicKeyBundle,
          invitation,
          new Date()
        )

        v2Convo = await ConversationV2.create(
          this.client,
          invitation,
          sealedInvite.v1.header
        )

        return [v2Convo]
      }
    )

    // Keep the typechecker happy
    // v2Convo should never actually be undefined. An error in the loader will bubble and halt execution
    if (!v2Convo) {
      throw new Error('Failed to create conversation')
    }
    return v2Convo
  }

  /**
   * Exports all conversations to a JSON serializable list that can be stored in your application.
   * WARNING: Be careful with where you store this data. It contains encryption keys for V2 conversations, which can be used to read/write messages.
   */
  async export(): Promise<ConversationExport[]> {
    const conversations = await this.list()
    return conversations.map((convo) => convo.export())
  }

  /**
   * Import a list of conversations exported using `conversations.export()`.
   * This list must be exhaustive, as the SDK will only look for conversations
   * started after the last imported conversation (-30 seconds) in subsequent calls to `conversations.list()`
   */
  async import(convoExports: ConversationExport[]): Promise<number> {
    const v1Exports: ConversationV1[] = []
    const v2Exports: ConversationV2[] = []
    let failed = 0

    for (const convoExport of convoExports) {
      try {
        if (convoExport.version === 'v1') {
          v1Exports.push(ConversationV1.fromExport(this.client, convoExport))
        } else if (convoExport.version === 'v2') {
          v2Exports.push(ConversationV2.fromExport(this.client, convoExport))
        }
      } catch (e) {
        console.log('Failed to import conversation', e)
        failed += 1
      }
    }

    await Promise.all([
      this.v1Cache.load(async () => v1Exports),
      this.v2Cache.load(async () => v2Exports),
    ])

    return failed
  }

  private async sendInvitation(
    recipient: SignedPublicKeyBundle,
    invitation: InvitationV1,
    created: Date
  ): Promise<SealedInvitation> {
    const sealed = await SealedInvitation.createV1({
      sender: this.client.keys,
      recipient,
      created,
      invitation,
    })

    const peerAddress = await recipient.walletSignatureAddress()
    this.client.publishEnvelopes([
      {
        contentTopic: buildUserInviteTopic(peerAddress),
        message: sealed.toBytes(),
        timestamp: created,
      },
      {
        contentTopic: buildUserInviteTopic(this.client.address),
        message: sealed.toBytes(),
        timestamp: created,
      },
    ])

    return sealed
  }

  private getPeerAddress(message: MessageV1): string {
    const peerAddress =
      message.recipientAddress === this.client.address
        ? message.senderAddress
        : message.recipientAddress

    // This assertion is safe, so long as messages have been through the filter
    return peerAddress as string
  }
}

function isMatchingContext(
  contextA?: InvitationContext,
  contextB?: InvitationContext
): boolean {
  // Use == to allow null and undefined to be equivalent
  return contextA?.conversationId === contextB?.conversationId
}
