import { keystore } from '@xmtp/proto'
import { PublicKeyBundle } from '../crypto/PublicKeyBundle'
import { KeystoreError } from '../keystore/errors'
import { MessageV1 } from '../Message'

export const validateKeystoreResponse = (
  response:
    | keystore.DecryptResponse_Response
    | keystore.EncryptResponse_Response
) => {
  if (response.error) {
    throw new KeystoreError(response.error.code, response.error.message)
  }
  if (!response.result) {
    throw new KeystoreError(
      keystore.ErrorCode.ERROR_CODE_UNSPECIFIED,
      'No result from Keystore'
    )
  }
}

export const buildDecryptV1Request = (
  messages: MessageV1[],
  myPublicKeyBundle: PublicKeyBundle
): keystore.DecryptV1Request => {
  return {
    requests: messages.map((m: MessageV1) => {
      const sender = new PublicKeyBundle({
        identityKey: m.header.sender?.identityKey,
        preKey: m.header.sender?.preKey,
      })

      const isSender = myPublicKeyBundle.equals(sender)

      return {
        payload: m.ciphertext,
        peerKeys: isSender
          ? new PublicKeyBundle({
              identityKey: m.header.recipient?.identityKey,
              preKey: m.header.recipient?.preKey,
            })
          : sender,
        headerBytes: m.headerBytes,
        isSender,
      }
    }),
  }
}
