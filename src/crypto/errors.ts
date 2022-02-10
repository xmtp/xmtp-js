export class NoMatchingPreKeyError extends Error {
  constructor() {
    super('no matching pre-key')
  }
}
