import { ciphertext } from '@xmtp/proto'
import { sha256 } from './encryption'
import type { PrivateKey, SignedPrivateKey } from './PrivateKey'
import type { PublicKey, SignedPublicKey } from './PublicKey'
import Signature from './Signature'

const IV_LENGTH = 16
const EPHEMERAL_PUBLIC_KEY_LENGTH = 65
const MAC_LENGTH = 32
const AES_BLOCK_SIZE = 16

const assertEciesLengths = (
  ecies: ciphertext.SignedEciesCiphertext_Ecies
): void => {
  if (ecies.iv.length !== IV_LENGTH) {
    throw new Error('Invalid iv length')
  }
  if (ecies.ephemeralPublicKey.length !== EPHEMERAL_PUBLIC_KEY_LENGTH) {
    throw new Error('Invalid ephemPublicKey length')
  }
  if (
    ecies.ciphertext.length < 1 ||
    ecies.ciphertext.length % AES_BLOCK_SIZE !== 0
  ) {
    throw new Error('Invalid ciphertext length')
  }
  if (ecies.mac.length !== MAC_LENGTH) {
    throw new Error('Invalid mac length')
  }
}

export default class SignedEciesCiphertext
  implements ciphertext.SignedEciesCiphertext
{
  eciesBytes: Uint8Array
  signature: Signature
  ciphertext: ciphertext.SignedEciesCiphertext_Ecies

  constructor({ eciesBytes, signature }: ciphertext.SignedEciesCiphertext) {
    if (!eciesBytes || !eciesBytes.length) {
      throw new Error('eciesBytes is empty')
    }
    if (!signature) {
      throw new Error('signature is undefined')
    }
    this.eciesBytes = eciesBytes
    this.signature = new Signature(signature)
    this.ciphertext = ciphertext.SignedEciesCiphertext_Ecies.decode(eciesBytes)
  }

  toBytes(): Uint8Array {
    return ciphertext.SignedEciesCiphertext.encode(this).finish()
  }

  async verify(pubKey: PublicKey | SignedPublicKey): Promise<boolean> {
    return pubKey.verify(this.signature, await sha256(this.eciesBytes))
  }

  static fromBytes(data: Uint8Array): SignedEciesCiphertext {
    const obj = ciphertext.SignedEciesCiphertext.decode(data)

    return new SignedEciesCiphertext(obj)
  }

  static async create(
    ecies: ciphertext.SignedEciesCiphertext_Ecies,
    signer: PrivateKey | SignedPrivateKey
  ): Promise<SignedEciesCiphertext> {
    assertEciesLengths(ecies)

    const eciesBytes =
      ciphertext.SignedEciesCiphertext_Ecies.encode(ecies).finish()
    const signature = await signer.sign(await sha256(eciesBytes))

    return new SignedEciesCiphertext({ eciesBytes, signature })
  }
}
