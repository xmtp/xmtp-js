import { Authenticator } from '../authn'

export interface Store {
  set(key: string, value: Buffer): Promise<void>
  get(key: string): Promise<Buffer | null>
  setAuthenticator?(authenticator: Authenticator): void
}
