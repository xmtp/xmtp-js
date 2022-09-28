import { SignedPrivateKey } from './../src/crypto/PrivateKey'
import { SealedInvitation } from '../src/Invitation'
import { newWallet } from './helpers'
import { WalletSigner } from '../src/crypto/Signature'

const sender = SignedPrivateKey.generate(new WalletSigner(newWallet()))
// const recipient = Signe

describe('Invitations', () => {
  describe('SealedInvitation', async () => {
    // co
  })
})
