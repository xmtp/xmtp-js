/**
 * This file is necessary to ensure that the crypto library is available
 * in node and the browser
 */

// eslint-disable-next-line no-restricted-syntax
import { webcrypto as nodeCrypto } from 'crypto'

const webcrypto =
  typeof globalThis === 'object' && 'crypto' in globalThis
    ? (globalThis.crypto as nodeCrypto.Crypto)
    : undefined

const crypto = webcrypto ?? nodeCrypto

export default crypto
