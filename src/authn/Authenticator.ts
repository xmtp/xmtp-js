// Commenting out this package until we have support for authn in GRPC
// import Libp2p from 'libp2p'
// import PeerId from 'peer-id'

// import { AuthnRequest } from './AuthnRequest'
// import { AuthnResponse } from './AuthnResponse'
// import { AuthnSender, ProductionAuthnSender } from './AuthnSender'
// import { PrivateKey } from '../crypto'

// const PROTO_AUTHN = '/xmtplabs/xmtp-v1/clientauthn/1.0.0'

// // authnResult is the primary return type.
// export interface AuthnResult {
//   isAuthenticated: boolean
//   errorString?: string
// }

// export type AuthnOptions = {
//   // Specify a different sending mechanism for the authenticator to use. By default the ProductionAuthnSender is used.
//   sender: AuthnSender
// }

// /**
//   Authenticator securely provides a clients Identity to an XMTP node in order
//   to allow the sending of messages
//  */
// export class Authenticator {
//   identityKey: PrivateKey
//   libp2p: Libp2p
//   walletAddress: string
//   private authnState: Map<string, boolean> = new Map()
//   private sender: AuthnSender

//   constructor(libp2p: Libp2p, identityKey: PrivateKey, sender: AuthnSender) {
//     this.identityKey = identityKey
//     this.libp2p = libp2p
//     this.walletAddress = identityKey.publicKey.walletSignatureAddress()
//     this.sender = sender
//   }

//   static create(
//     libp2p: Libp2p,
//     identityKey: PrivateKey,
//     authOpts?: AuthnOptions
//   ): Authenticator {
//     const sender = authOpts?.sender
//       ? authOpts.sender
//       : new ProductionAuthnSender()

//     const authenticator = new Authenticator(libp2p, identityKey, sender)
//     return authenticator
//   }

//   // Check if this peer id has been previously authenticated with
//   hasAuthenticated(remotePeerId: PeerId): boolean {
//     return this.authnState.get(remotePeerId.toB58String()) ?? false
//   }

//   async authenticate(remotePeerId: PeerId): Promise<AuthnResult> {
//     const localPeerId = this.libp2p.peerId

//     const authnReq = await AuthnRequest.create(
//       this.identityKey,
//       localPeerId.toB58String()
//     )

//     const response = await this.sendAuthnRequest(remotePeerId, authnReq)
//     const result = response.isSuccess()
//     this.authnState.set(remotePeerId.toB58String(), result)

//     return {
//       isAuthenticated: result,
//       ...(!result && { errorString: response.getErrorStr() }),
//     }
//   }

//   private async sendAuthnRequest(
//     remotePeerId: PeerId,
//     authnReq: AuthnRequest
//   ): Promise<AuthnResponse> {
//     const conn = this.libp2p.connectionManager.get(remotePeerId)
//     if (!conn) {
//       throw new Error(`cannot authenticate without valid connection`)
//     }

//     const { stream } = await conn.newStream(PROTO_AUTHN)
//     const response = await this.sender.send(stream, authnReq)
//     return response
//   }
// }
