import Libp2p from 'libp2p'
import PeerId from 'peer-id'

import { AuthRequest, AuthResponse } from './AuthRequests'
import { AuthSender, ProductionAuthSender } from './AuthSender'
import { PrivateKey } from '../crypto'

const PROTO_AUTH = '/xmtplabs/xmtp-v1/clientauth/0.1.0-beta1'

// AuthResult is the primary return type.
export interface AuthResult {
  isAuthenticated: boolean
  errorString?: string
}

export type AuthOptions = {
  // Specify a different sending mechanism for the authenticator to use
  alternativeSender: AuthSender
}

/**
  Authenticator securely provides a clients Identity to an XMTP node in order
  to allow the sending of messages
 */
export default class Authenticator {
  identityKey: PrivateKey
  libp2p: Libp2p
  walletAddress: string
  private authState: Map<string, boolean> = new Map()
  private sender: AuthSender

  constructor(libp2p: Libp2p, identityKey: PrivateKey, sender: AuthSender) {
    this.identityKey = identityKey
    this.libp2p = libp2p
    this.walletAddress = identityKey.publicKey.walletSignatureAddress()
    this.sender = sender
  }

  static create(
    libp2p: Libp2p,
    identityKey: PrivateKey,
    authOpts?: AuthOptions
  ): Authenticator {
    const sender = authOpts?.alternativeSender
      ? authOpts.alternativeSender
      : new ProductionAuthSender()

    const authenticator = new Authenticator(libp2p, identityKey, sender)
    return authenticator
  }

  // Check if this peer id has been previously authenticated with
  hasAuthenticated(remotePeerId: PeerId): boolean {
    return this.authState.get(remotePeerId.toB58String()) ?? false
  }

  async authenticate(remotePeerId: PeerId): Promise<AuthResult> {
    const localPeerId = this.libp2p.peerId

    const authReq = await AuthRequest.createRequest(
      this.identityKey,
      localPeerId.toB58String()
    )

    const response = await this.sendAuthRequest(remotePeerId, authReq)
    const result = response.isSuccess()
    this.authState.set(remotePeerId.toB58String(), result)

    return {
      isAuthenticated: result,
      ...(!result && { errorString: response.getErrorStr() }),
    }
  }

  private async sendAuthRequest(
    remotePeerId: PeerId,
    authReq: AuthRequest
  ): Promise<AuthResponse> {
    const conn = this.libp2p.connectionManager.get(remotePeerId)
    if (!conn) {
      throw new Error(`cannot authenticate without valid connection`)
    }

    const { stream } = await conn.newStream(PROTO_AUTH)
    const response = await this.sender.send(stream, authReq)
    return response
  }
}
