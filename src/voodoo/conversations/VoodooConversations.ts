import { messageApi } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import VoodooClient, {
  VoodooContact,
  EncryptedVoodooMessage,
  VoodooMessage,
} from '../VoodooClient'
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
      const newConvosFromInvites = await this.client.listEnvelopes(
        inviteTopic,
        this.processInvite.bind(this)
      )

      for (const convo of newConvosFromInvites) {
        if (convo) {
          this.conversations.set(convo.peerAddress, convo)
        }
      }
      return Array.from(this.conversations.values())
    } finally {
      release()
    }
  }

  // Must be locked by convoMutex
  async processInvite(
    env: messageApi.Envelope
  ): Promise<VoodooConversation | undefined> {
    const encryptedInvite: EncryptedVoodooMessage =
      await this.client.decodeEnvelope(env)
    const peerAddress = encryptedInvite.senderAddress
    // Check if we have a session for this peer
    if (this.conversations.has(peerAddress)) {
      // Return undefined so nothing is added to the map
      return
    }

    const decryptedInvite: VoodooMessage =
      await this.client.processVoodooInvite(peerAddress, encryptedInvite)
    if (decryptedInvite) {
      const conversation = new VoodooConversation(
        this.client,
        decryptedInvite.sessionId,
        decryptedInvite.plaintext, // the plaintext of the invite message is the new convo topic
        decryptedInvite.senderAddress,
        decryptedInvite.timestamp
      )
      return conversation
    }
  }

  /**
   * Creates a new VoodooConversation for the given address. Will throw an error if the peer is not found in the XMTP network
   */
  async newConversation(peerAddress: string): Promise<VoodooConversation> {
    const contact = await this.client.getUserContactFromNetwork(peerAddress)
    if (!contact) {
      throw new Error(
        `Voodoo recipient ${peerAddress} is not on the XMTP network`
      )
    }

    // Better be a VoodooContact type
    if (!contact.voodooInstance) {
      throw new Error(`Voodoo recipient ${peerAddress} is not a Voodoo contact`)
    }

    // TODO: add more context eventually
    const matcherFn = (convo: VoodooConversation) =>
      convo.peerAddress === peerAddress

    return this.convoMutex.runExclusive(async () => {
      const existing = Array.from(this.conversations.values())
      const existingMatch = existing.find(matcherFn)
      if (existingMatch) {
        return existingMatch
      }

      // Create a new VoodooConversation
      const convo = await this.createConvo(contact as VoodooContact)
      this.conversations.set(peerAddress, convo)
      return convo
    })
  }

  // TODO: We need to rename outbound/inbound into invites of some sort
  // Currently, we generate a random topic for the session, and send an Olm PreKey Message
  // where the encrypted ciphertext is just the random topic. This is the "invite" message.
  // The recipient processes the Olm PreKey Message and gets the random topic, and then
  // creates their own VoodooConversation from the derived session and the included topic.
  private async createConvo(
    recipient: VoodooContact
  ): Promise<VoodooConversation> {
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
      await this.client.newVoodooInvite(
        recipient.address,
        generatedSessionTopic
      )

    if (!encryptedInvite) {
      throw new Error('Could not create outbound session')
    }

    // TODO: should derive this from wallet signature
    const peerAddress = recipient.address

    // Only publish to the peer's inbox, store the conversation locally
    await this.client.publishEnvelopes([
      {
        contentTopic: buildVoodooUserInviteTopic(peerAddress),
        // The entire message is the encrypted invite
        message: Buffer.from(JSON.stringify(encryptedInvite)),
        // Date from timestamp
        timestamp: new Date(timestamp),
      },
    ])

    const convo = new VoodooConversation(
      this.client,
      encryptedInvite.sessionId,
      generatedSessionTopic,
      peerAddress,
      timestamp
    )
    return convo
  }
}
