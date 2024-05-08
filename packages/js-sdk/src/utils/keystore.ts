import { keystore } from '@xmtp/proto'
import { PublicKeyBundle } from '@/crypto/PublicKeyBundle'
import { KeystoreError } from '@/keystore/errors'
import type { MessageV1 } from '@/Message'
import type { WithoutUndefined } from './typedefs'

type EncryptionResponseResult<
  T extends
    | keystore.DecryptResponse_Response
    | keystore.EncryptResponse_Response,
> = WithoutUndefined<T>['result']

// Validates the Keystore response. Throws on errors or missing fields.
// Returns a type with all possibly undefined fields required to be defined
export const getResultOrThrow = <
  T extends
    | keystore.DecryptResponse_Response
    | keystore.EncryptResponse_Response,
>(
  response: T
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

  if ('encrypted' in response.result && !response.result.encrypted) {
    throw new Error('Missing ciphertext')
  }

  if ('decrypted' in response.result && !response.result.decrypted) {
    throw new Error('Missing decrypted result')
  }

  return response.result as EncryptionResponseResult<T>
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
