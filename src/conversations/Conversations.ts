import { messageApi, keystore } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import { SignedPublicKeyBundle } from './../crypto/PublicKeyBundle'
import { ListMessagesOptions } from './../Client'
import { InvitationContext } from './../Invitation'
import { Conversation, ConversationV1, ConversationV2 } from './Conversation'
import { MessageV1, DecodedMessage } from '../Message'
import Stream from '../Stream'
import Client from '../Client'
import {
  b64Decode,
  buildUserIntroTopic,
  buildUserInviteTopic,
  dateToNs,
  nsToDate,
} from '../utils'
import { PublicKeyBundle } from '../crypto'
import { SortDirection } from '../ApiClient'
import Long from 'long'

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
  private v2Mutex: Mutex

  constructor(client: Client) {
    this.client = client
    this.v1Cache = new ConversationCache()
    this.v2Mutex = new Mutex()
  }

  /**
   * List all conversations with the current wallet found in the network.
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

  /**
   * List all V2 conversations
   */
  private async listV2Conversations(): Promise<Conversation[]> {
    return this.v2Mutex.runExclusive(async () => {
      // Get all conversations already in the KeyStore
      const existing = await this.getV2ConversationsFromKeystore()
      const latestConversationTime = existing[existing.length - 1]?.createdAt

      // Load all conversations started after the newest conversation found
      const newConversations = await this.updateV2Conversations(
        latestConversationTime
      )

      // Create a Set of all the existing topics to ensure no duplicates are added
      const existingTopics = new Set(existing.map((c) => c.topic))
      // Add all new conversations to the existing list
      for (const convo of newConversations) {
        if (!existingTopics.has(convo.topic)) {
          existing.push(convo)
          existingTopics.add(convo.topic)
        }
      }

      // Sort the result set by creation time in ascending order
      existing.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      return existing
    })
  }

  private async getV2ConversationsFromKeystore(): Promise<ConversationV2[]> {
    return (await this.client.keystore.getV2Conversations()).map(
      this.conversationReferenceToV2.bind(this)
    )
  }

  // Called in listV2Conversations and in newConversation
  async updateV2Conversations(startTime?: Date): Promise<ConversationV2[]> {
    const envelopes = await this.client.listInvitations({
      startTime: startTime
        ? new Date(+startTime - CLOCK_SKEW_OFFSET_MS)
        : undefined,
      direction: SortDirection.SORT_DIRECTION_ASCENDING,
    })

    return this.decodeInvites(envelopes)
  }

  private async decodeInvites(
    envelopes: messageApi.Envelope[],
    shouldThrow = false
  ): Promise<ConversationV2[]> {
    const { responses } = await this.client.keystore.saveInvites({
      requests: envelopes.map((env) => ({
        payload: b64Decode(env.message as unknown as string),
        timestampNs: Long.fromString(env.timestampNs as string),
        contentTopic: env.contentTopic as string,
      })),
    })

    const out: ConversationV2[] = []
    for (const response of responses) {
      try {
        const convo = this.saveInviteResponseToConversation(response)
        out.push(convo)
      } catch (e) {
        console.warn('Error saving invite response to conversation: ', e)
        if (shouldThrow) {
          throw e
        }
      }
    }
    return out
  }

  private saveInviteResponseToConversation({
    result,
    error,
  }: keystore.SaveInvitesResponse_Response): ConversationV2 {
    if (error || !result || !result.conversation) {
      throw new Error(`Error from keystore: ${error?.code} ${error?.message}}`)
    }
    return this.conversationReferenceToV2(result.conversation)
  }

  private conversationReferenceToV2(
    convoRef: keystore.ConversationReference
  ): ConversationV2 {
    return new ConversationV2(
      this.client,
      convoRef.topic,
      convoRef.peerAddress,
      nsToDate(convoRef.createdNs),
      convoRef.context
    )
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
        const peerAddress = this.getPeerAddress(msg)
        if (!newPeer(peerAddress)) {
          return undefined
        }
        await msg.decrypt(this.client.keystore, this.client.publicKeyBundle)
        return new ConversationV1(this.client, peerAddress, msg.sent)
      }
      if (env.contentTopic === inviteTopic) {
        const results = await this.decodeInvites([env], true)
        if (results.length) {
          return results[0]
        }
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
        const peerAddress = this.getPeerAddress(msg)

        // Temporarily create a convo to decrypt the message
        const convo = new ConversationV1(
          this.client,
          peerAddress as string,
          msg.sent
        )

        // TODO: This duplicates the proto deserialization unnecessarily
        // Refactor to avoid duplicate work
        return convo.decodeMessage(env)
      }

      // Decode as an invite and return the envelope
      // This gives the contentTopicUpdater everything it needs to add to the topic list
      if (contentTopic === inviteTopic) {
        const results = await this.decodeInvites([env], true)
        return results[0]
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
    const topic = buildUserIntroTopic(this.client.address)
    const messages = await this.client.listEnvelopes(
      topic,
      (env) => {
        return MessageV1.fromBytes(b64Decode(env.message as unknown as string))
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
          try {
            // Verify that the message can be decrypted before treating the intro as valid
            await message.decrypt(
              this.client.keystore,
              this.client.publicKeyBundle
            )
            seenPeers.set(peerAddress, message.sent)
          } catch (e) {
            continue
          }
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
        if (!this.client.signedPublicKeyBundle.isFromLegacyBundle()) {
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

    return this.v2Mutex.runExclusive(async () => {
      const existing = await this.getV2ConversationsFromKeystore()
      const existingMatch = existing.find(matcherFn)
      if (existingMatch) {
        return existingMatch
      }
      const latestSeen = existing[existing.length - 1]?.createdAt
      const newItems = await this.updateV2Conversations(latestSeen)
      const newItemMatch = newItems.find(matcherFn)
      // If one of those matches, return it to update the cache
      if (newItemMatch) {
        return newItemMatch
      }

      return this.createV2Convo(contact as SignedPublicKeyBundle, context)
    })
  }

  private async createV2Convo(
    recipient: SignedPublicKeyBundle,
    context?: InvitationContext
  ): Promise<ConversationV2> {
    const timestamp = new Date()
    const { payload, conversation } = await this.client.keystore.createInvite({
      recipient,
      context,
      createdNs: dateToNs(timestamp),
    })
    if (!payload || !conversation) {
      throw new Error('Required field not returned from Keystore')
    }

    const peerAddress = await recipient.walletSignatureAddress()

    await this.client.publishEnvelopes([
      {
        contentTopic: buildUserInviteTopic(peerAddress),
        message: payload,
        timestamp,
      },
      {
        contentTopic: buildUserInviteTopic(this.client.address),
        message: payload,
        timestamp,
      },
    ])

    return this.conversationReferenceToV2(conversation)
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
