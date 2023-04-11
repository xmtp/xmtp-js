// TODO: this is a hacky wrapper class for a Voodoo contact,
// currently represented by the entire contact's VoodooInstance
// - should be changed to align with VoodooPublicAccount (or whatever)
// it ends up being named in Rust
export class VoodooContact {
  address: string
  // TODO: Replace this `any` by exporting appropriate type from xmtpv3 WASM binding package
  voodooInstance: any

  constructor(address: string, voodooInstance: any) {
    this.address = address
    this.voodooInstance = voodooInstance
  }
}

// Very simple message object which acts as the message type for all Voodoo envelopes
export type EncryptedVoodooMessage = {
  // Plaintext fields
  senderAddress: string
  timestamp: number
  // SessionId may be dropped in the future
  sessionId: string
  // Ciphertext fields
  ciphertext: string
}

// The object to be JSON-serialized to form the body(plaintext) of the invite
export type VoodooInvite = {
  topic: string
  // Addresses of the two wallets in the conversation
  // not necessarily the two voodoo instances in a single 1:1 session
  // e.g. Me1 sending my messages in convo to Me2
  participantAddresses: string[]
}

export type VoodooMessage = {
  // All plaintext fields
  senderAddress: string
  timestamp: number
  plaintext: string
  // SessionId may be dropped in the future
  sessionId: string
}

// Contains multiple contact bundles that each represent a device that
// the user has access to. We must send messages to all of these devices
// in order to ensure that the user receives the message. Additionally, we
// must consolidate messages from any of these devices into a single logical
// stream deduplicated by address.
export type VoodooMultiBundle = {
  // The address of the user
  address: string
  // The bundles for each device
  contacts: VoodooContact[]
  // Last refreshed timestamp
  timestamp: number
}

// Helpful wrapper for wrapping a single one-to-one session, which
// later can be composed into a VoodooMultiSession
export type OneToOneSession = {
  // The two addresses participating in the higher level conversation
  participantAddresses: string[]
  sessionId: string
  topic: string
  timestamp: number
  // optional encryptedInvite
  encryptedInvite?: EncryptedVoodooMessage
}

// Contains all the information needed to send a message to a user
export type VoodooMultiSession = {
  // The address of the user
  otherAddress: string
  myMultiBundle: VoodooMultiBundle
  otherMultiBundle: VoodooMultiBundle
  // Keep the multi bundle around for convenience
  establishedContacts: VoodooContact[]
  // Session ids in the same order as the contacts
  sessionIds: string[]
  // Messages per session, so map sessionId to list of messages
  messages: Map<string, VoodooMessage[]>
  // My messages TODO: will need to aggregate self-sessions here too
  myMessages: VoodooMessage[]
  // Topics per session
  topics: string[]
}
