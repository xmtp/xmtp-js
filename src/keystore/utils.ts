import {
  keystore,
  type conversationReference,
  type invitation,
  type publicKey,
} from '@xmtp/proto'
import type { XmtpEnv } from '@/Client'
import {
  PublicKeyBundle,
  SignedPublicKeyBundle,
} from '@/crypto/PublicKeyBundle'
import type { WithoutUndefined } from '@/utils/typedefs'
import { KeystoreError } from './errors'
import type { TopicData } from './interfaces'

export const convertError = (
  e: Error,
  // Default error code to apply to errors that don't have one
  errorCode: keystore.ErrorCode
) => {
  if (e instanceof KeystoreError) {
    return e
  }

  return new KeystoreError(errorCode, e.message)
}

export const wrapResult = <T>(result: T): { result: T } => ({ result })

type ResultOrError<T> = { result: T } | { error: KeystoreError }

// Map an array of items to an array of results or errors
// Transform any errors thrown into `KeystoreError`s
export const mapAndConvertErrors = <Input, Output>(
  input: Input[],
  mapper: (input: Input) => Promise<Output> | Output,
  // Default error code to apply to errors that don't have one
  errorCode: keystore.ErrorCode
): Promise<ResultOrError<Output>[]> => {
  return Promise.all(
    input.map(async (item: Input) => {
      try {
        // Be sure to await mapper result to catch errors
        return wrapResult(await mapper(item))
      } catch (e) {
        return { error: convertError(e as Error, errorCode) }
      }
    })
  )
}

// Wrap the bundle in our class if not already wrapped
export const toPublicKeyBundle = (bundle: publicKey.PublicKeyBundle) => {
  if (bundle instanceof PublicKeyBundle) {
    return bundle
  }

  return new PublicKeyBundle(bundle)
}

// Wrap the bundle in our class if not already wrapped
export const toSignedPublicKeyBundle = (
  bundle: publicKey.SignedPublicKeyBundle
) => {
  if (bundle instanceof SignedPublicKeyBundle) {
    return bundle
  }

  return new SignedPublicKeyBundle(bundle)
}

// Takes object and returns true if none of the `objectFields` are null or undefined and none of the `arrayFields` are empty
export const validateObject = <T>(
  obj: T,
  objectFields: (keyof T)[],
  arrayFields: (keyof T)[]
): obj is WithoutUndefined<T> => {
  for (const field of objectFields) {
    if (!obj[field]) {
      throw new KeystoreError(
        keystore.ErrorCode.ERROR_CODE_INVALID_INPUT,
        `Missing field ${String(field)}`
      )
    }
  }
  for (const field of arrayFields) {
    const val = obj[field]
    // @ts-expect-error does not know it's an array
    if (!val || !val?.length) {
      throw new KeystoreError(
        keystore.ErrorCode.ERROR_CODE_INVALID_INPUT,
        `Missing field ${String(field)}`
      )
    }
  }

  return true
}

export const getKeyMaterial = (
  invite: invitation.InvitationV1 | undefined
): Uint8Array => {
  if (!invite?.aes256GcmHkdfSha256?.keyMaterial) {
    throw new KeystoreError(
      keystore.ErrorCode.ERROR_CODE_INVALID_INPUT,
      'Missing key material'
    )
  }
  return invite.aes256GcmHkdfSha256.keyMaterial
}

export const topicDataToV2ConversationReference = ({
  invitation,
  createdNs,
  peerAddress,
}: TopicData): conversationReference.ConversationReference => ({
  context: invitation.context,
  topic: invitation.topic,
  peerAddress,
  createdNs,
  consentProofPayload: invitation.consentProof,
})

export const isCompleteTopicData = (
  obj: keystore.TopicMap_TopicData
): obj is TopicData => !!obj.invitation

export const topicDataToMap = (topicMap: keystore.TopicMap) => {
  const out = new Map<string, keystore.TopicMap_TopicData>()
  for (const [k, v] of Object.entries(topicMap.topics)) {
    out.set(k, v)
  }
  return out
}

export const buildPersistenceKey = (env: XmtpEnv, walletAddress: string) =>
  `xmtp/${env}/${walletAddress}/`
