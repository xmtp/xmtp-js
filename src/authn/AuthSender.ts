import concat from 'it-concat'
import lp from 'it-length-prefixed'
import { pipe } from 'it-pipe'
import Libp2p from 'libp2p'

import { AuthRequest, AuthResponse } from './AuthRequests'

// AuthSender abstraction allows the send functionality of the Authenticator class to be changed at runtime.
// This is helpful for testing failure and edge cases.
export abstract class AuthSender {
  abstract send(
    stream: Libp2p.MuxedStream,
    authReq: AuthRequest
  ): Promise<AuthResponse>
}

// StreamAuthSender is the primary production sender implemention. This should be used in all cases outside of
// testing and debugging
export class ProductionAuthSender extends AuthSender {
  async send(
    stream: Libp2p.MuxedStream,
    authReq: AuthRequest
  ): Promise<AuthResponse> {
    const result = await pipe(
      [authReq.encode()],
      lp.encode(),
      stream,
      lp.decode(),
      concat
    )

    return AuthResponse.decode(result.slice())
  }
}
