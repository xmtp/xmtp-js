import VoodooClient from '../VoodooClient'
import {
  EncryptedVoodooMessage,
  VoodooMessage,
  VoodooMultiBundle,
  VoodooMultiSession,
  VoodooContact,
  OneToOneSession,
} from '../types'
import Stream from '../../Stream'
import { messageApi } from '@xmtp/proto'

import { utils } from '../../crypto'

import {
  buildVoodooUserInviteTopic,
  buildVoodooDirectMessageTopic,
} from '../utils'

/**
 * This class represents a conversation between two users.
 * It needs to manage various 1:1 messaging sessions between devices that
 * comprise this conversation.
 * - 1:1s between my current VoodooInstance and my other ones (on other devices possibly)
 * - 1:1s between my current VoodooInstance and my peer's VoodooInstances
 *
 * The VoodooMultiSession object holds most of this state, but some invariants are only captured
 * in code.
 * - A VoodooConversation only adds more 1:1 sessions upon sending a message. This is just a design
 *   choice to avoid churn i.e. if B receives an invite from A, and sends per-device invites back to all of B and A devices.
 *   This could happen all at once for all online devices causing a bit of a thundering herd problem.
 * - A VoodooConversation only sends to one given session per contact. Even though multiple sessions may exist between
 *   two contacts e.g. if both devices send invites to each other at the same time
 * - sessionIds, topics, and establishedContacts are all in the same order
 * - Messages sent by this specific VoodooInstance are stored in myMessages
 * - Messages sent by other VoodooInstances are stored in the messages map in the VoodooMultiSession
 * - When compiling all messages, all sessions must be checked and messages sorted appropriately after combining with
 *   myMessages
 *
 * NOTE: One major gap is the lack of invite-refreshing when receiving. Right now this is handled by VoodooConversations.list()
 * but should be handled by the VoodooConversation itself. The tricky bit is that we end up needing to pull all invites
 * across all possible conversations, rearranging and filtering, etc.
 */
export default class VoodooConversation {
  otherAddress: string
  createdAt: number
  multiSession: VoodooMultiSession
  private client: VoodooClient

  constructor(
    client: VoodooClient,
    otherAddress: string,
    createdAt: number,
    myMultiBundle: VoodooMultiBundle,
    otherMultiBundle: VoodooMultiBundle,
    sessionIds: string[],
    topics: string[]
  ) {
    this.client = client
    this.otherAddress = otherAddress
    this.createdAt = createdAt
    const messages = new Map<string, VoodooMessage[]>()
    sessionIds.forEach((sessionId) => {
      messages.set(sessionId, [])
    })
    this.multiSession = {
      otherAddress,
      myMultiBundle,
      otherMultiBundle,
      establishedContacts: [],
      sessionIds,
      messages,
      myMessages: [],
      topics,
    }
  }

  // Helper function to get a new empty conversation
  static newEmptyConversation(
    client: VoodooClient,
    myMultiBundle: VoodooMultiBundle,
    otherMultiBundle: VoodooMultiBundle,
    otherAddress: string
  ): VoodooConversation {
    const createdAt = Date.now()
    return new VoodooConversation(
      client,
      otherAddress,
      createdAt,
      myMultiBundle,
      otherMultiBundle,
      [],
      []
    )
  }

  get clientAddress(): string {
    return this.client.address
  }

  // TODO: this is an important implementation detail for Voodoo - we cannot
  // decrypt already decrypted messages since ratchet state has progressed
  // so we must check if we have new messages, then combine them with the existing
  // this.messages list
  private async messagesPerSession(
    topic: string,
    sessionId: string
  ): Promise<VoodooMessage[]> {
    // Check for new messages
    const newMessages = await this.client.listEnvelopes(
      topic,
      this.processEnvelope.bind(this)
    )

    // Try decrypting them via this.client
    // TODO: for now, we just drop everything that doesn't decrypt correctly
    // this can happen because we cannot decrypt our own messages anyways.
    // Append the remaining messages to this.messages.
    // NOTE: Vodozemac can tolerate something like 2000 messages out-of-order
    // by accelerating the ratchet and storing skipped message keys in a buffer
    const decryptedMessages = await newMessages.map(async (m) => {
      try {
        // Decode the envelope
        const encryptedVoodooMessage = await this.client.decodeEnvelope(m)
        const decryptedMessage = await this.client.decryptMessage(
          sessionId,
          encryptedVoodooMessage
        )
        if (decryptedMessage) {
          return decryptedMessage
        }
      } catch (e) {
        console.log('Failed to decrypt message', e)
      }
    })

    // Wait for all promises in decryptedMessages to resolve
    const results = await Promise.all(decryptedMessages)

    let messages = this.multiSession.messages.get(sessionId)
    if (!messages) {
      messages = []
    }

    for (const m of results) {
      if (m) {
        messages.push(m)
      }
    }
    // Sort all messages
    messages.sort((a: VoodooMessage, b: VoodooMessage) => {
      return a.timestamp - b.timestamp
    })
    this.multiSession.messages.set(sessionId, messages)
    return messages
  }

  // Provides an aggregated and sorted list of messages for all of the device sessions
  // NOTE: we may have duplicate sessions per peer contact device, but we subscribe
  // to the idea that each message only gets sent once per receiving device. This
  // invariant is enforced on send. If we have two sessions for the same contact,
  // we just send to the first one
  // TODO: this only returns a complete list of messages if VoodooConversations.list()
  // has been called first. That method adds any sessionIds we missed from invites that
  // have been added. Ideally, this should happen each time we call messages() or something.
  async messages(): Promise<VoodooMessage[]> {
    // Go through and call messagesPerSession for each session
    let allMessages: VoodooMessage[] = []
    for (let i = 0; i < this.multiSession.sessionIds.length; i++) {
      const sessionId = this.multiSession.sessionIds[i]
      const topic = this.multiSession.topics[i]
      const messages = await this.messagesPerSession(topic, sessionId)
      allMessages = allMessages.concat(messages)
    }

    // Add in myMessages
    allMessages = allMessages.concat(this.multiSession.myMessages)

    // Sort allMessages
    allMessages.sort((a: VoodooMessage, b: VoodooMessage) => {
      return a.timestamp - b.timestamp
    })
    return allMessages
  }

  streamMessages(): Promise<Stream<VoodooMessage>> {
    throw new Error('Method not implemented.')
  }

  // TODO: we should unify on same timestamp for all messages, can rework encryptMessage for this later
  private async sendToSession(
    topic: string,
    sessionId: string,
    content: string
  ): Promise<VoodooMessage> {
    const encryptedVoodooMessage = await this.client.encryptMessage(
      sessionId,
      content
    )
    await this.client.publishEnvelopes([
      {
        contentTopic: topic,
        message: Buffer.from(JSON.stringify(encryptedVoodooMessage)),
      },
    ])
    const sentMessage = {
      senderAddress: encryptedVoodooMessage.senderAddress,
      sessionId: encryptedVoodooMessage.sessionId,
      timestamp: encryptedVoodooMessage.timestamp,
      plaintext: content,
    }
    return sentMessage
  }

  // Uses sendToSession on all sessions, appends sent messages to this.multiSession.myMessages
  // NOTE: important that we only ever send to one session per contact device. Multiple
  // can exist, for example if that device sends an invite to us, but we just sent one to them.
  async send(content: string): Promise<VoodooMessage> {
    // Before sending, try updateConversationAndSendInvitesIfNeeded
    await this.updateConversationAndSendInvitesIfNeeded(
      this.multiSession.myMultiBundle,
      this.multiSession.otherMultiBundle
    )

    // Go through and call sendToSession for each session
    let sentMessage: VoodooMessage | undefined
    const alreadyMessagedContacts: VoodooContact[] = []
    for (let i = 0; i < this.multiSession.sessionIds.length; i++) {
      const contact = this.multiSession.establishedContacts[i]
      if (alreadyMessagedContacts.filter((c) => c.equals(contact)).length > 0) {
        continue
      }
      alreadyMessagedContacts.push(contact)
      const sessionId = this.multiSession.sessionIds[i]
      const topic = this.multiSession.topics[i]
      sentMessage = await this.sendToSession(topic, sessionId, content)
    }
    if (!sentMessage) {
      throw new Error('Failed to send message')
    }
    // Only push the message once
    this.multiSession.myMessages.push(sentMessage)
    return sentMessage
  }

  // passthrough for now
  async processEnvelope(
    env: messageApi.Envelope
  ): Promise<messageApi.Envelope> {
    return env
  }

  /**
   * Creates a new single OneToOneSession for the given contact. Does not publish the invite envelope.
   *
   * NOTE: we have to very explicit about what this session is. It's a session between two VoodooInstances,
   * but the two addresses participating could be the same. So otherAddress is only used as the
   * payload of the invite, but the invite is encrypted for contact and delivered to the contact.address
   *
   * Currently, we generate a random topic for the session, and send an Olm PreKey Message
   * where the encrypted ciphertext is just the random topic. This is the "invite" message.
   * The recipient processes the Olm PreKey Message and gets the random topic, and then
   * creates their own VoodooConversation from the derived session and the included topic.
   */
  private async newSingleSession(
    // the otherAddress is the wallet address of the other party in the conversation, not necessarily
    // the other party of this session e.g. Me1 sending my messages in convo to Me2
    otherAddress: string,
    contact: VoodooContact
  ): Promise<OneToOneSession> {
    // Better be a VoodooContact type
    if (!contact.voodooInstance) {
      throw new Error(`Voodoo recipient is not a Voodoo contact`)
    }

    const timestamp = new Date().getTime()

    // Generate the random topic for the session and set it as the first
    // plaintext message sent
    const generatedSessionTopic = buildVoodooDirectMessageTopic(
      Buffer.from(utils.getRandomValues(new Uint8Array(32)))
        .toString('base64')
        .replace(/=*$/g, '')
        // Replace slashes with dashes so that the topic is still easily split by /
        // We do not treat this as needing to be valid Base64 anywhere
        .replace('/', '-')
    )

    // Create an outbound session with { sessionId: string, paylaod: string (encoded Olm PreKey Message) }
    const encryptedInvite: EncryptedVoodooMessage =
      await this.client.newVoodooInviteForContact(
        contact,
        otherAddress,
        generatedSessionTopic
      )

    if (!encryptedInvite) {
      throw new Error('Could not create outbound session')
    }
    return {
      participantAddresses: [this.client.address, otherAddress],
      envelopeReceiverAddress: contact.address,
      sessionId: encryptedInvite.sessionId,
      topic: generatedSessionTopic,
      encryptedInvite,
      timestamp,
    }
  }

  // Given a VoodooConversation, check to make sure that all of the instances in my multibundle
  // and the other's multibundle are stored in the VoodooConversation
  async updateConversationAndSendInvitesIfNeeded(
    myMultiBundle: VoodooMultiBundle,
    otherMultiBundle: VoodooMultiBundle
  ): Promise<VoodooConversation> {
    // Look at sessions with myself
    const sessions: OneToOneSession[] = []
    const newContacts: VoodooContact[] = []
    // Combine all the contacts from my multibundle and the other's multibundle
    const allContacts = [
      ...myMultiBundle.contacts,
      ...otherMultiBundle.contacts,
    ]
    // We know which contact corresponds to self and other because we have both multibundles stored
    // in the coversation
    for (const contact of allContacts) {
      // Skip if this is the same contact as myself
      if (this.client.contactInstanceIsMe(contact)) {
        continue
      }
      // Check if we already have a session with this contact
      // Merge newContacts and establishedContacts
      const allContacts = [
        ...this.multiSession.establishedContacts,
        ...newContacts,
      ]
      if (allContacts.find((c: VoodooContact) => c.equals(contact))) {
        continue
      }
      const session = await this.newSingleSession(this.otherAddress, contact)
      sessions.push(session)
      newContacts.push(contact)
    }

    const sessionIds = sessions.map((s) => s.sessionId)
    const topics = sessions.map((s) => s.topic)
    const encryptedInviteEnvelopes = sessions
      .map((s) => ({
        contentTopic: buildVoodooUserInviteTopic(s.envelopeReceiverAddress),
        message: Buffer.from(JSON.stringify(s.encryptedInvite)),
        timestamp: new Date(s.timestamp),
      }))
      .filter((e) => e !== undefined)

    // Need to publish all of the encryptedInvites
    await this.client.publishEnvelopes(encryptedInviteEnvelopes)

    // Add the sessions, topics, and establishedContacts to the existing VoodooConversation.multiSession
    this.multiSession.establishedContacts.push(...newContacts)
    this.multiSession.sessionIds.push(...sessionIds)
    this.multiSession.topics.push(...topics)
    return this
  }
}
