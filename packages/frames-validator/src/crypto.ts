import { webcrypto } from "node:crypto"

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await webcrypto.subtle.digest("SHA-256", data)
  return new Uint8Array(hash)
}
