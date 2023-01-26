import { ErrorCode, KeystoreError } from './errors'
import { ResultOrError } from './interfaces'

export function mapAndConvertErrors<Input, Output>(
  input: Input[],
  mapper: (input: Input) => Promise<Output> | Output,
  // Default error code to apply to errors that don't have one
  errorCode: ErrorCode
): Promise<ResultOrError<Output>[]> {
  return Promise.all(
    input.map(async (item: Input) => {
      try {
        return await mapper(item)
      } catch (e) {
        return convertError(e as Error, errorCode)
      }
    })
  )
}

export function convertError(
  e: Error,
  // Default error code to apply to errors that don't have one
  errorCode: ErrorCode
) {
  if (e instanceof KeystoreError) {
    return e
  }

  return new KeystoreError(errorCode, e.message)
}
