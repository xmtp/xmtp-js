import { messageApi } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import VoodooClient from '../VoodooClient'
import {
  VoodooContact,
  EncryptedVoodooMessage,
  VoodooMultiBundle,
  OneToOneSession,
  VoodooInvite,
} from '../types'
import VoodooConversation from './VoodooConversation'

import { buildVoodooUserInviteTopic } from '../utils'

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

      // TODO: instead of one shared invite topic, should we do per-address-pairing invite topics?
      // Seems easier but sacrifices privacy.
      //
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
          if (!convo.multiSession.sessionIds.includes(session.sessionId)) {
            convo.multiSession.sessionIds.push(session.sessionId)
            convo.multiSession.topics.push(session.topic)
            convo.multiSession.establishedContacts.push(contact)
          }
        }
        this.conversations.set(otherAddress, convo)
      }
      return Array.from(this.conversations.values())
    } finally {
      release()
    }
  }

  /**
   * Creates a new VoodooConversation for a peerAddress by creating newSingleSessions for each VoodooContact found.
   * And aggregating all the topics/sessionIds into a single VoodooConversation.
   */
  async newConversation(otherAddress: string): Promise<VoodooConversation> {
    // Call a list first to refresh conversations that might be incoming
    await this.list()

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
      const updatedConvo = await convo.updateConversationAndSendInvitesIfNeeded(
        myMultiBundle,
        otherMultiBundle
      )
      this.conversations.set(otherAddress, updatedConvo)
      return convo
    })
  }
}
