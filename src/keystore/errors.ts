export enum ErrorCode {
  KEYSTORE_UNAVAILABLE = 0, // maps to GRPC code 14 and HTTP code 503 (service unavailable)
  UNAUTHENTICATED = 1, // maps to GRPC code 16 and HTTP code 401 (unauthorized)
  UNAUTHORIZED = 2, // maps to GRPC code 7 and HTTP code 403 (forbidden)
  INVALID_REQUEST = 3, // maps to GRPC code 3 and HTTP code 400 (bad request)
  UNIMPLEMENTED = 4, // maps to GRPC code 12 and HTTP code 501 (not implemented)
  INTERNAL_ERROR = 5, // maps to GRPC code 13 and HTTP code 500 (internal server error)
  VALIDATION_FAILED = 6, // maps to GRPC code 3 and HTTP code 400 (bad request)
  NOT_FOUND = 7, // maps to GRPC code 5 and HTTP code 404 (not found)
}

export class KeystoreError extends Error {
  code: ErrorCode
  error: string

  constructor(code: ErrorCode, message: string) {
    super(message)
    this.error = message
    this.code = code
  }
}
