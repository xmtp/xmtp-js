import Libp2p from 'libp2p'
import { AuthnRequest } from '../../src/authn/AuthnRequest'
import { AuthnResponse } from '../../src/authn/AuthnResponse'
import { AuthnData } from '../../src/authn/AuthnData'
import { AuthSender, ProductionAuthSender } from '../../src/authn/AuthSender'
import { bytesToHex } from '../../src/crypto/utils'

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
    return AuthnResponse.createResponse(this.returnValue, '')
  }
}

export class ExportAuthSender extends ProductionAuthSender {
  async send(
    stream: Libp2p.MuxedStream,
    authReq: AuthnRequest
  ): Promise<AuthnResponse> {
    const authBytes = authReq.proto.v1?.authDataBytes
    if (!authBytes) {
      throw new Error('unable to decode authbytes')
    }
    const authData = AuthnData.decode(authBytes)

    const testcase = `    testCase{
      peerID:     "${authData.proto.peerId}",
      walletAddr: "${authData.proto.walletAddr}",
      reqBytes:   "${bytesToHex(authReq.encode())}",
    }`
    console.log(testcase)
    return await super.send(stream, authReq)
  }
}
