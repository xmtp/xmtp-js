import { publicKey } from '@xmtp/proto'
import { PublicKeyBundle, SignedPublicKeyBundle } from '../crypto'
import { ErrorCode, KeystoreError } from './errors'
import { ResultOrError } from './interfaces'

export const convertError = (
  e: Error,
  // Default error code to apply to errors that don't have one
  errorCode: ErrorCode
) => {
  if (e instanceof KeystoreError) {
    return e
  }

  return new KeystoreError(errorCode, e.message)
}

// Map an array of items to an array of results or errors
// Transform any errors thrown into `KeystoreError`s
export const mapAndConvertErrors = <Input, Output>(
  input: Input[],
  mapper: (input: Input) => Promise<Output> | Output,
  // Default error code to apply to errors that don't have one
  errorCode: ErrorCode
): Promise<ResultOrError<Output>[]> => {
  return Promise.all(
    input.map(async (item: Input) => {
      try {
        // Be sure to await mapper result to catch errors
        return await mapper(item)
      } catch (e) {
        return convertError(e as Error, errorCode)
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
