import Token from './Token'

export interface Authenticator {
  createToken(timestamp?: Date): Promise<Token>
}
