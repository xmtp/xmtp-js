import {
  importHmacKey,
  exportHmacKey,
  hkdfHmacKey,
  validateHmac,
  generateHmac,
} from '../../src/crypto/encryption'
import crypto from '../../src/crypto/crypto'

describe('HMAC encryption', () => {
  it('generates and validates HMAC', async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32))
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const message = crypto.getRandomValues(new Uint8Array(32))
    const hmac = await generateHmac(secret, salt, message)
    const key = await hkdfHmacKey(secret, salt)
    const valid = await validateHmac(key, hmac, message)
    expect(valid).toBe(true)
  })

  it('generates and validates HMAC with imported key', async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32))
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const message = crypto.getRandomValues(new Uint8Array(32))
    const hmac = await generateHmac(secret, salt, message)
    const key = await hkdfHmacKey(secret, salt)
    const exportedKey = await exportHmacKey(key)
    const importedKey = await importHmacKey(exportedKey)
    const valid = await validateHmac(importedKey, hmac, message)
    expect(valid).toBe(true)
  })

  it('fails to validate HMAC with wrong message', async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32))
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const message = crypto.getRandomValues(new Uint8Array(32))
    const hmac = await generateHmac(secret, salt, message)
    const key = await hkdfHmacKey(secret, salt)
    const valid = await validateHmac(
      key,
      hmac,
      crypto.getRandomValues(new Uint8Array(32))
    )
    expect(valid).toBe(false)
  })

  it('fails to validate HMAC with wrong key', async () => {
    const secret = crypto.getRandomValues(new Uint8Array(32))
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const message = crypto.getRandomValues(new Uint8Array(32))
    const hmac = await generateHmac(secret, salt, message)
    const valid = await validateHmac(
      await hkdfHmacKey(
        crypto.getRandomValues(new Uint8Array(32)),
        crypto.getRandomValues(new Uint8Array(32))
      ),
      hmac,
      message
    )
    expect(valid).toBe(false)
  })
})
