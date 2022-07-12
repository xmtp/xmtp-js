import Libp2p from 'libp2p'
import { AuthnRequest } from '../../src/authn/AuthnRequest'
import { AuthnResponse } from '../../src/authn/AuthnResponse'
import { AuthnSender } from '../../src/authn/AuthnSender'

// AuthnSendMock provides an alternative authnSender for testing. The returned response can be set
// inorder to test failure cases easily
export class MockAuthnSender extends AuthnSender {
  returnValue: boolean

  constructor(returnValue: boolean) {
    super()
    this.returnValue = returnValue
  }

  setResponse(returnValue: boolean): boolean {
    this.returnValue = !!returnValue
    return this.returnValue
  }

  async send(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stream: Libp2p.MuxedStream,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authnReq: AuthnRequest
  ): Promise<AuthnResponse> {
    return AuthnResponse.create(this.returnValue, '')
  }
}
