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

export type VoodooMessage = {
  // All plaintext fields
  senderAddress: string
  timestamp: number
  plaintext: string
  // SessionId may be dropped in the future
  sessionId: string
}
