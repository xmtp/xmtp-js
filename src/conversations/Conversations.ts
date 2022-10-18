import { SignedPublicKeyBundle } from './../crypto/PublicKeyBundle'
import { InvitationContext } from './../Invitation'
import { Conversation, ConversationV1, ConversationV2 } from './Conversation'
import { MessageV1 } from '../Message'
import Stream from '../Stream'
import Client from '../Client'
import {
  buildDirectMessageTopic,
  buildUserIntroTopic,
  buildUserInviteTopic,
} from '../utils'
import { SealedInvitation, InvitationV1 } from '../Invitation'
import { PublicKeyBundle } from '../crypto'
import { messageApi } from '@xmtp/proto'

const messageHasHeaders = (msg: MessageV1): boolean => {
  return Boolean(msg.recipientAddress && msg.senderAddress)
}
/**
 * Conversations allows you to view ongoing 1:1 messaging sessions with another wallet
 */
export default class Conversations {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  /**
   * List all conversations with the current wallet found in the network, deduped by peer address
   */
  async list(): Promise<Conversation[]> {
    const [seenPeers, invitations] = await Promise.all([
      this.getIntroductionPeers(),
      this.client.listInvitations(),
    ])

    const conversations: Conversation[] = []
    seenPeers.forEach((sent, peerAddress) =>
      conversations.push(new ConversationV1(this.client, peerAddress, sent))
    )

    for (const sealed of invitations) {
      const unsealed = await sealed.v1.getInvitation(this.client.keys)
      conversations.push(
        await ConversationV2.create(this.client, unsealed, sealed.v1.header)
      )
    }

    conversations.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    return conversations
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
        const msg = await this.client.decodeEnvelope(env)
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
   * Returns a stream for all new messages from existing and new conversations.
   */
  async streamAllMessages(): Promise<Stream<MessageV1>> {
    const conversations = await this.list()
    const dmAddresses: string[] = []
    for (const conversation of conversations) {
      dmAddresses.push(conversation.peerAddress)
    }
    const introTopic = buildUserIntroTopic(this.client.address)
    const topics = this.buildTopicsForAllMessages(dmAddresses, introTopic)

    // If we detect a new intro topic, update the stream's direct message topics to include the new topic
    const contentTopicUpdater = (msg: MessageV1): string[] | undefined => {
      if (msg.contentTopic !== introTopic || !messageHasHeaders(msg)) {
        return undefined
      }
      const peerAddress = this.getPeerAddress(msg)
      if (
        dmAddresses.includes(peerAddress) ||
        peerAddress === this.client.address
      ) {
        // No need to update if we're already subscribed
        return undefined
      }
      dmAddresses.push(peerAddress)
      return this.buildTopicsForAllMessages(dmAddresses, introTopic)
    }

    // Filter intro topics if already streaming direct messages for that address to avoid duplicates
    const filter = (msg: MessageV1): boolean => {
      if (
        msg.contentTopic === introTopic &&
        messageHasHeaders(msg) &&
        dmAddresses.includes(this.getPeerAddress(msg))
      ) {
        return false
      }
      return true
    }

    return Stream.create<MessageV1>(
      this.client,
      topics,
      async (env) => {
        const msg = await this.client.decodeEnvelope(env)
        return filter(msg) ? msg : undefined
      },
      contentTopicUpdater
    )
  }

  private async getIntroductionPeers(): Promise<Map<string, Date>> {
    const messages = await this.client.listIntroductionMessages()
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
   * Builds a list of topics for existing conversations and new intro topics
   */
  private buildTopicsForAllMessages(
    peerAddresses: string[],
    introTopic: string
  ): string[] {
    const topics = peerAddresses.map((address) =>
      buildDirectMessageTopic(address, this.client.address)
    )
    // Ensure we listen for new conversation topics as well
    topics.push(introTopic)
    return topics
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

    if (!context?.conversationId) {
      const intros = await this.getIntroductionPeers()
      const introSentTime = intros.get(peerAddress)
      // If intro already exists, return V1 conversation
      if (introSentTime) {
        return new ConversationV1(this.client, peerAddress, introSentTime)
      }
    }

    // Coerce the contact into a V2 bundle
    if (contact instanceof PublicKeyBundle) {
      contact = SignedPublicKeyBundle.fromLegacyBundle(contact)
    }

    for (const sealedInvite of await this.client.listInvitations()) {
      const isSamePeer =
        sealedInvite.v1.header.recipient.equals(contact) ||
        sealedInvite.v1.header.sender.equals(contact)
      if (!isSamePeer) {
        continue
      }
      try {
        // Need to decode invite even without a context to ensure decryption succeeds and invite is valid
        const invite = await sealedInvite.v1.getInvitation(this.client.keys)
        // If the contexts match, return early
        if (isMatchingContext(context, invite.context)) {
          return await ConversationV2.create(
            this.client,
            invite,
            sealedInvite.v1.header
          )
        }
      } catch (e) {
        console.warn('Error decoding invite', e)
      }
    }

    // If no existing invite, send a new one
    const invitation = InvitationV1.createRandom(context)
    const sealedInvite = await this.sendInvitation(
      contact,
      invitation,
      new Date()
    )
    return ConversationV2.create(
      this.client,
      invitation,
      sealedInvite.v1.header
    )
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
