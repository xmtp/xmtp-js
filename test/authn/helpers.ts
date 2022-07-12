import Libp2p from 'libp2p'
import { AuthnRequest } from '../../src/authn/AuthnRequest'
import { AuthnResponse } from '../../src/authn/AuthnResponse'
import { AuthSender } from '../../src/authn/AuthSender'

// AuthSendMock provides an alternative AuthSender for testing. The returned response can be set
// inorder to test failure cases easily
export class MockAuthSender extends AuthSender {
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
    authReq: AuthnRequest
  ): Promise<AuthnResponse> {
    return AuthnResponse.create(this.returnValue, '')
  }
}
