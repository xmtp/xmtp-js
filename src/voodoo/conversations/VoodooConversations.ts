import { messageApi } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import VoodooClient from '../VoodooClient'
import {
  VoodooContact,
  EncryptedVoodooMessage,
  VoodooMessage,
  VoodooMultiBundle,
  OneToOneSession,
  VoodooInvite,
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

      console.log(`Found ${rawInvites.length} invites`)

      // Go through all invites and obtain a list of peers we have conversations with
      // some of these invites will be for ourselves which is expected. We'll
      // extract the participants from the invite after decryption
      const peers = new Set<string>()
      for (const env of rawInvites) {
        const encryptedInvite: EncryptedVoodooMessage =
          await this.client.decodeEnvelope(env)
        const envelopeSenderAddress = encryptedInvite.senderAddress
        peers.add(envelopeSenderAddress)
      }
      // Add self to peers too
      peers.add(this.client.address)

      console.log(`Found ${peers.size} peers`)

      // Create a map of peer to multibundle via this.client.getUserContactMultiBundle
      const peerToMultiBundle = new Map<string, VoodooMultiBundle>()
      for (const peer of peers) {
        const multibundle = await this.client.getUserContactMultiBundle(peer)
        if (!multibundle) {
          console.log(`Could not get multibundle for ${peer}`)
          continue
        }
        peerToMultiBundle.set(peer, multibundle)
      }

      console.log(`Found ${peerToMultiBundle.size} multibundles`)

      // Now we can go through each invite and attempt to process with a list of Contacts
      // obtained by looking up the multibundle per peer
      const sessionsFromInvites: OneToOneSession[] = []
      const sessionContacts: VoodooContact[] = []
      // Decrypt all invites
      for (const env of rawInvites) {
        const encryptedInvite: EncryptedVoodooMessage =
          await this.client.decodeEnvelope(env)
        const envelopeSenderAddress = encryptedInvite.senderAddress
        const multibundle = peerToMultiBundle.get(envelopeSenderAddress)
        if (!multibundle) {
          console.log(`Could not get multibundle for ${envelopeSenderAddress}`)
          continue
        }
        const contacts: VoodooContact[] = multibundle.contacts
        try {
          const [deducedContact, decryptedInvite] =
            await this.client.processVoodooInviteGuessContact(
              contacts,
              encryptedInvite
            )
          // Parse the text as a JSON-serialized VoodooInvite
          const invite: VoodooInvite = JSON.parse(decryptedInvite.plaintext)

          if (decryptedInvite) {
            const session = {
              participantAddresses: invite.participantAddresses,
              sessionId: decryptedInvite.sessionId,
              envelopeReceiverAddress: deducedContact.address,
              // the plaintext of the invite message is the new convo topic
              topic: invite.topic,
              timestamp: decryptedInvite.timestamp,
            }
            sessionsFromInvites.push(session)
            sessionContacts.push(deducedContact)
            console.log(
              `Processed invite from ${envelopeSenderAddress} with session ${session.sessionId} and deduced contact ${deducedContact.address}`
            )
          }
        } catch (e) {
          // Too noisy to log since we expect failures
          console.log(
            `Could not process invite from ${envelopeSenderAddress}: ${e}`
          )
        }
      }

      // REMEMBER: envelopeSenderAddress at this point is who sent the invite, not necessarily who the
      // conversation is intended for e.g. my device A sends an invite to device B, but the
      // intent is for a conversation with Bob's device. So we need to determine who this
      // conversation is intended for by looking at the participants in the invite.
      //
      // Aggregate these one-to-one sessions into a map of lists keyed by convoOtherAddress
      // keeping the order the same between the two lists
      const sessionsByOtherAddress = new Map<string, OneToOneSession[]>()
      const contactsByOtherAddress = new Map<string, VoodooContact[]>()
      for (let i = 0; i < sessionsFromInvites.length; i++) {
        const session = sessionsFromInvites[i]
        const contact = sessionContacts[i]
        if (!session || !contact) {
          continue
        }
        // Find the otherAddress by looking at session participantAddresses
        const participantAddresses = session.participantAddresses
        // Check if my address is in there
        const myAddressIndex = participantAddresses.indexOf(this.client.address)
        if (myAddressIndex === -1) {
          console.log(
            `Could not find my address ${this.client.address} in participantAddresses ${participantAddresses}`
          )
          continue
        }
        // If so, then the other address is the other participant
        const otherAddressIndex = myAddressIndex === 0 ? 1 : 0
        const otherAddress = participantAddresses[otherAddressIndex]
        if (!otherAddress) {
          console.log(
            `Could not find other address in participantAddresses ${participantAddresses}`
          )
          continue
        }

        if (!sessionsByOtherAddress.has(otherAddress)) {
          sessionsByOtherAddress.set(otherAddress, [])
          contactsByOtherAddress.set(otherAddress, [])
        }
        sessionsByOtherAddress.get(otherAddress)?.push(session)
        contactsByOtherAddress.get(otherAddress)?.push(contact)
      }
      console.log(`Found ${sessionsByOtherAddress.size} peers with sessions`)
      console.log(`Found ${contactsByOtherAddress.size} peers with contacts`)

      // For each of these peer addresses, check if we have a conversation for it.
      // If not, then create a new empty VoodooConversation
      // 1) Add any new invite sessions to the conversation
      // 2) Send out new invites as necessary by invoking updateConversationAndSendInvitesIfNeeded

      // For each of these peer addresses, skip if we already have a conversation for it
      // otherwise we need to resolve the multibundle and construct a new conversation
      for (const [otherAddress, sessions] of sessionsByOtherAddress) {
        let convo = this.conversations.get(otherAddress)
        if (!convo) {
          // Get my multibundle, get other multibundle
          const myMultiBundle = await this.client.getUserContactMultiBundle(
            this.client.address
          )
          const otherMultiBundle = await this.client.getUserContactMultiBundle(
            otherAddress
          )
          if (!myMultiBundle || !otherMultiBundle) {
            console.log(this.conversations)
            console.log(
              `Could not get multibundle in session aggregation for ${otherAddress} or ${this.client.address}`
            )
            continue
          }
          // Construct a new conversation
          convo = VoodooConversation.newEmptyConversation(
            this.client,
            myMultiBundle,
            otherMultiBundle,
            otherAddress
          )
        }
        console.log(`conversation for ${otherAddress} is ${convo}`)
        const contacts = contactsByOtherAddress.get(otherAddress)
        if (!contacts || !sessions) {
          console.log(`Could not get contacts or sessions for ${otherAddress}`)
          continue
        }
        // Add any new invite sessions to the conversation
        for (let i = 0; i < sessions.length; i++) {
          const session = sessions[i]
          const contact = contacts[i]
          // Cannot open a session with ourselves
          if (this.client.contactInstanceIsMe(contact)) {
            continue
          }
          // Check that we don't already have this contact
          let hasContact = false
          for (const existingContact of convo.multiSession
            .establishedContacts) {
            if (existingContact.voodooInstance === contact.voodooInstance) {
              hasContact = true
              break
            }
          }
          if (
            !hasContact &&
            !convo.multiSession.sessionIds.includes(session.sessionId)
          ) {
            convo.multiSession.sessionIds.push(session.sessionId)
            convo.multiSession.topics.push(session.topic)
            convo.multiSession.establishedContacts.push(contact)
          }
        }
        this.conversations.set(otherAddress, convo)
      }

      // Finally, update all conversations and send out invites as necessary
      for (const convo of this.conversations.values()) {
        const myMultiBundle = peerToMultiBundle.get(this.client.address)
        const otherMultiBundle = peerToMultiBundle.get(convo.otherAddress)
        if (!myMultiBundle || !otherMultiBundle) {
          console.log(
            `Could not get multibundle in session update for ${convo.otherAddress} or ${this.client.address}`
          )
          continue
        }
        const updatedConvo =
          await this.updateConversationAndSendInvitesIfNeeded(
            convo,
            myMultiBundle,
            otherMultiBundle
          )
        if (updatedConvo) {
          this.conversations.set(convo.otherAddress, updatedConvo)
        }
      }
      return Array.from(this.conversations.values())
    } finally {
      release()
    }
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

  /**
   * Creates a new VoodooConversation for a peerAddress by creating newSingleSessions for each VoodooContact found.
   * And aggregating all the topics/sessionIds into a single VoodooConversation.
   */
  async newConversation(otherAddress: string): Promise<VoodooConversation> {
    const otherMultiBundle = await this.client.getUserContactMultiBundle(
      otherAddress
    )
    if (
      !otherMultiBundle ||
      !otherMultiBundle.contacts ||
      otherMultiBundle.contacts.length === 0
    ) {
      throw new Error(
        `Voodoo recipient ${otherAddress} is not on the XMTP network`
      )
    }

    const myMultiBundle = await this.client.getUserContactMultiBundle(
      this.client.address
    )
    if (
      !myMultiBundle ||
      !myMultiBundle.contacts ||
      myMultiBundle.contacts.length === 0
    ) {
      throw new Error(`Voodoo sender not on the XMTP network`)
    }

    // TODO: add more context eventually
    const matcherFn = (convo: VoodooConversation) =>
      convo.otherAddress === otherAddress

    // TODO: should we move some of this logic outside runExclusive? doing so
    // could cause a race where the whole slew of duplicate invites are emitted
    // from the same process
    return this.convoMutex.runExclusive(async () => {
      const existing = Array.from(this.conversations.values())
      const existingMatch = existing.find(matcherFn)
      let convo: VoodooConversation
      if (existingMatch) {
        convo = existingMatch
      } else {
        // Create an initial conversation that is empty
        convo = new VoodooConversation(
          this.client,
          otherAddress,
          new Date().getTime(),
          myMultiBundle,
          otherMultiBundle,
          [],
          []
        )
      }
      const updatedConvo = await this.updateConversationAndSendInvitesIfNeeded(
        convo,
        myMultiBundle,
        otherMultiBundle
      )
      this.conversations.set(otherAddress, updatedConvo)
      return convo
    })
  }

  // Given a VoodooConversation, check to make sure that all of the instances in my multibundle
  // and the other's multibundle are stored in the VoodooConversation
  async updateConversationAndSendInvitesIfNeeded(
    convo: VoodooConversation,
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
        ...convo.multiSession.establishedContacts,
        ...newContacts,
      ]
      if (
        allContacts.find(
          (c: VoodooContact) => c.voodooInstance === contact.voodooInstance
        )
      ) {
        continue
      }
      const session = await this.newSingleSession(convo.otherAddress, contact)
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
    convo.multiSession.establishedContacts.push(...newContacts)
    convo.multiSession.sessionIds.push(...sessionIds)
    convo.multiSession.topics.push(...topics)
    return convo
  }
}
