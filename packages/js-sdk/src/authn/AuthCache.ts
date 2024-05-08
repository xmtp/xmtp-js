import type { Authenticator } from './interfaces'
import type Token from './Token'

// Default to 10 seconds less than expected expiry to give some wiggle room near the end
// https://github.com/xmtp/xmtp-node-go/blob/main/pkg/api/authentication.go#L18
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 - 10

export default class AuthCache {
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
