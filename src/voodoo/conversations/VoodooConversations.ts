import { messageApi } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import VoodooClient from '../VoodooClient'
import {
  VoodooContact,
  EncryptedVoodooMessage,
  VoodooMessage,
  VoodooMultiBundle,
  OneToOneSession,
} from '../types'
import VoodooConversation from './VoodooConversation'
import { utils } from '../../crypto'

import {
  buildVoodooUserInviteTopic,
  buildVoodooDirectMessageTopic,
} from '../utils'

export default class VoodooConversations {
  private client: VoodooClient
  private conversations: Map<string, VoodooConversation> = new Map()
  private convoMutex: Mutex

  constructor(client: VoodooClient) {
    this.client = client
    this.convoMutex = new Mutex()
  }

  async list(): Promise<VoodooConversation[]> {
    const release = await this.convoMutex.acquire()
    try {
      // Check for new conversations in our invite topic
      const inviteTopic = buildVoodooUserInviteTopic(this.client.address)
      const rawInvites = await this.client.listEnvelopes(
        inviteTopic,
        async (e) => e
      )
      console.log('Got raw invites', rawInvites)
      const sessionsFromInvites = await this.client.listEnvelopes(
        inviteTopic,
        this.processInvite.bind(this)
      )

      // Aggregate these one-to-one sessions into a map of lists keyed by peerAddress
      const sessionsByPeer = new Map<string, OneToOneSession[]>()
      for (const session of sessionsFromInvites) {
        if (session) {
          const peerAddress = session.senderAddress
          if (sessionsByPeer.has(peerAddress)) {
            sessionsByPeer.get(peerAddress)?.push(session)
          } else {
            sessionsByPeer.set(peerAddress, [session])
          }
        }
      }

      // For each of these peer addresses, skip if we already have a conversation for it
      // otherwise we need to resolve the multibundle and construct a new conversation
      for (const [peerAddress, sessions] of sessionsByPeer) {
        if (!this.conversations.has(peerAddress)) {
          const multibundle = await this.client.getUserContactMultiBundle(
            peerAddress
          )
          if (multibundle) {
            const convo = new VoodooConversation(
              this.client,
              peerAddress,
              new Date().getTime(),
              multibundle,
              sessions.map((s) => s.sessionId),
              sessions.map((s) => s.topic)
            )
            this.conversations.set(peerAddress, convo)
          }
        }
      }
      return Array.from(this.conversations.values())
    } finally {
      release()
    }
  }

  // Must be locked by convoMutex
  // TODO: this method currently looks up the other party's multibundle for NxN fanout
  // we may want to carry this information in the invite itself otherwise there could be
  // a mismatch on the initial set of devices and the set we resolve in this method
  async processInvite(
    env: messageApi.Envelope
  ): Promise<OneToOneSession | undefined> {
    console.log(`Processing invite envelope: ${env}`)
    const encryptedInvite: EncryptedVoodooMessage =
      await this.client.decodeEnvelope(env)
    const peerAddress = encryptedInvite.senderAddress
    // Check if we have a session for this peer
    if (this.conversations.has(peerAddress)) {
      // Return undefined so nothing is added to the map
      console.log(`Already have a conversation with ${peerAddress}`)
      return
    }

    try {
      const decryptedInvite: VoodooMessage =
        await this.client.processVoodooInvite(peerAddress, encryptedInvite)
      if (decryptedInvite) {
        console.log(`Decrypted invite from ${peerAddress}`)
        return {
          senderAddress: decryptedInvite.senderAddress,
          recipientAddress: this.client.address,
          sessionId: decryptedInvite.sessionId,
          // the plaintext of the invite message is the new convo topic
          topic: decryptedInvite.plaintext,
          timestamp: decryptedInvite.timestamp,
        }
      }
    } catch (e) {
      console.log(`Error processing invite from ${peerAddress}: ${e}`)
    }
  }

  /**
   * Creates a new single OneToOneSession for the given contact. Does nto publish the invite envelope.
   *
   * Currently, we generate a random topic for the session, and send an Olm PreKey Message
   * where the encrypted ciphertext is just the random topic. This is the "invite" message.
   * The recipient processes the Olm PreKey Message and gets the random topic, and then
   * creates their own VoodooConversation from the derived session and the included topic.
   */
  private async newSingleSession(
    contact: VoodooContact
  ): Promise<OneToOneSession> {
    const peerAddress = contact.address
    if (!contact) {
      throw new Error(
        `Voodoo recipient ${peerAddress} is not on the XMTP network`
      )
    }

    // Better be a VoodooContact type
    if (!contact.voodooInstance) {
      throw new Error(`Voodoo recipient ${peerAddress} is not a Voodoo contact`)
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
        generatedSessionTopic
      )

    if (!encryptedInvite) {
      throw new Error('Could not create outbound session')
    }
    return {
      senderAddress: this.client.address,
      recipientAddress: peerAddress,
      sessionId: encryptedInvite.sessionId,
      topic: generatedSessionTopic,
      encryptedInvite,
      timestamp,
    }
  }

  /**
   * Creates a new VoodooConversation for a peerAddress by creating newSingleSessions for each VoodooContact found.
   * And aggregating all the topics/sessionIds into a single VoodooConversation.
   */
  async newConversation(peerAddress: string): Promise<VoodooConversation> {
    const multibundle = await this.client.getUserContactMultiBundle(peerAddress)
    if (!multibundle) {
      throw new Error(
        `Voodoo recipient ${peerAddress} is not on the XMTP network`
      )
    }

    const contacts = multibundle.contacts
    if (!contacts || contacts.length === 0) {
      throw new Error(`Voodoo recipient ${peerAddress} is not a Voodoo contact`)
    }
    // TODO: add more context eventually
    const matcherFn = (convo: VoodooConversation) =>
      convo.peerAddress === peerAddress

    // TODO: should we move some of this logic outside runExclusive? doing so
    // could cause a race where the whole slew of duplicate invites are emitted
    // from the same process
    return this.convoMutex.runExclusive(async () => {
      const existing = Array.from(this.conversations.values())
      const existingMatch = existing.find(matcherFn)
      if (existingMatch) {
        return existingMatch
      }

      const sessions: OneToOneSession[] = []
      for (const contact of contacts) {
        if (!contact.voodooInstance) {
          throw new Error(
            `Voodoo recipient ${peerAddress} is not a Voodoo contact`
          )
        }
        const session = await this.newSingleSession(contact)
        sessions.push(session)
      }

      const sessionIds = sessions.map((s) => s.sessionId)
      const topics = sessions.map((s) => s.topic)
      const encryptedInviteEnvelopes = sessions
        .map((s) => ({
          contentTopic: buildVoodooUserInviteTopic(peerAddress),
          message: Buffer.from(JSON.stringify(s.encryptedInvite)),
          timestamp: new Date(s.timestamp),
        }))
        .filter((e) => e !== undefined)

      // Need to publish all of the encryptedInvites
      await this.client.publishEnvelopes(encryptedInviteEnvelopes)
      // Create a new VoodooConversation
      const convo = new VoodooConversation(
        this.client,
        peerAddress,
        new Date().getTime(),
        multibundle,
        sessionIds,
        topics
      )
      this.conversations.set(peerAddress, convo)
      return convo
    })
  }
}
