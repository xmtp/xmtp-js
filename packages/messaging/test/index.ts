import assert from 'assert';
import { Wallet } from 'ethers';
import {
  Message,
  PrivateKey,
  PrivateKeyBundle,
} from '../src';

describe('Messaging', function () {
  it('fully encodes/decodes messages', async function () {
    const aliceWalletKey = PrivateKey.generate();
    assert.ok(aliceWalletKey.secp256k1);
    const aliceWallet = new Wallet(aliceWalletKey.secp256k1.bytes);
    // Alice's key bundle
    const alice = await PrivateKeyBundle.generate(aliceWallet);
    const alicePub = alice.publicKeyBundle;
    assert.ok(alice.identityKey);
    assert.deepEqual(alice.identityKey.publicKey, alicePub.identityKey);
    // Bob's key bundle
    const bob = await PrivateKeyBundle.generate();

    // Alice encodes message for Bob
    const msg1 = await Message.encode(alice, bob.publicKeyBundle, 'Yo!');
    assert.equal(msg1.senderAddress(), aliceWallet.address);
    assert.equal(msg1.decrypted, 'Yo!');

    // Bob decodes message from Alice
    const msg2 = await Message.decode(bob, msg1.toBytes());
    assert.equal(msg1.decrypted, msg2.decrypted);
    assert.equal(msg2.senderAddress(), aliceWallet.address);
  });

});
