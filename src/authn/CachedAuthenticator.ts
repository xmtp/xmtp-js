import Authenticator from './Authenticator'
import Token from './Token'

// Default to 10 seconds less than expected expiry to give some wiggle room near the end
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 - 10

export default class CachedAuthenticator {
  private authenticator: Authenticator
  private token?: Token
  maxAgeMs: number

  constructor(
    authenticator: Authenticator,
    cacheExpirySeconds = DEFAULT_MAX_AGE_SECONDS
  ) {
    this.authenticator = authenticator
    this.maxAgeMs = cacheExpirySeconds * 1000
  }

  async getToken(): Promise<string> {
    if (!this.token || this.token.ageMs > this.maxAgeMs) {
      await this.refresh()
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.token!.toBase64()
  }

  async refresh(): Promise<void> {
    this.token = await this.authenticator.createToken()
  }
}
