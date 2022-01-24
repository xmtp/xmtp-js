import * as assert from 'assert';
import { TextEncoder, TextDecoder } from 'util';
import {
  KeyBundle,
  PrivateKeyBundle,
  PublicKey,
  utils
} from '../../src/crypto';
import * as ethers from 'ethers';

describe('Crypto', function () {
  it('signs keys and verifies signatures', async function () {
    // Identity Key
    const [iPri, iPub] = utils.generateKeys();
    // Pre-Key
    const [, pPub] = utils.generateKeys();
    await iPri.signKey(pPub);
    assert.ok(await iPub.verifyKey(pPub));
  });
  it('encrypts and decrypts messages', async function () {
    // Alice
    const [aPri, aPub] = utils.generateKeys();
    // Bob
    const [bPri, bPub] = utils.generateKeys();
    const msg1 = 'Yo!';
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await aPri.encrypt(decrypted, bPub);
    // Bob decrypts msg from Alice.
    const decrypted2 = await bPri.decrypt(encrypted, aPub);
    const msg2 = new TextDecoder().decode(decrypted2);
    assert.equal(msg2, msg1);
  });
  it('detects tampering with encrypted message', async function () {
    // Alice
    const [aPri, aPub] = utils.generateKeys();
    // Bob
    const [bPri, bPub] = utils.generateKeys();
    const msg1 = 'Yo!';
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await aPri.encrypt(decrypted, bPub);
    // Malory tampers with the message
    encrypted.payload[2] ^= 4; // flip one bit
    // Bob attempts to decrypt msg from Alice.
    try {
      await bPri.decrypt(encrypted, aPub);
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e instanceof Error);
      // Note: This is Node behavior, not sure what browsers will do.
      assert.equal(e.toString(), 'Error: Cipher job failed');
    }
  });
  it('derives public key from signature', async function () {
    const [pri, pub] = utils.generateKeys();
    const digest = utils.getRandomValues(new Uint8Array(16));
    const sig = await pri.sign(digest);
    const pub2 = sig.getPublicKey(digest);
    assert.ok(pub2);
    assert.equal(utils.bytesToHex(pub2.bytes), utils.bytesToHex(pub.bytes));
  });
  it('derives address from public key', function () {
    // using the sample from https://kobl.one/blog/create-full-ethereum-keypair-and-address/
    const bytes = utils.hexToBytes(
      '04836b35a026743e823a90a0ee3b91bf615c6a757e2b60b9e1dc1826fd0dd16106f7bc1e8179f665015f43c6c81f39062fc2086ed849625c06e04697698b21855e'
    );
    const pub = new PublicKey(bytes);
    const address = pub.getEthereumAddress();
    assert.equal(address, '0x0bed7abd61247635c1973eb38474a2516ed1d884');
  });
  it('encrypts and decrypts messages with key bundles', async function () {
    // Alice
    const [aPri, aPub] = await utils.generateBundles();
    // Bob
    const [bPri, bPub] = await utils.generateBundles();
    const msg1 = 'Yo!';
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await aPri.encrypt(decrypted, bPub);
    // Bob decrypts msg from Alice.
    const decrypted2 = await bPri.decrypt(encrypted, aPub);
    const msg2 = new TextDecoder().decode(decrypted2);
    assert.equal(msg2, msg1);
  });
  it('serializes and desirializes keys and signatures', async function () {
    const [, pub] = await utils.generateBundles();
    const bytes = pub.encode();
    assert.ok(bytes.length >= 213);
    const pub2 = KeyBundle.decode(bytes);
    assert.ok(pub2.identityKey.verifyKey(pub2.preKey));
  });
  it('fully encodes/decodes messages', async function () {
    // Alice
    const [aPri] = await utils.generateBundles();
    // Bob
    const [bPri, bPub] = await utils.generateBundles();
    const msg1 = 'Yo!';
    const bytes = await aPri.encodeMessage(bPub, msg1);
    // assert.equal(bytes.length, 508);
    assert.ok(bytes.length >= 506);
    const msg2 = await bPri.decodeMessage(bytes);
    assert.equal(msg1, msg2);
  });
  it('signs keys using a wallet', async function () {
    // create a wallet using a generated key
    const [wPri, wPub] = utils.generateKeys();
    const wallet = new ethers.Wallet(wPri.bytes);
    // sanity check that we agree with the wallet about the address
    assert.ok(wallet.address, wPub.getEthereumAddress());
    // sign the public key using the wallet
    await wPub.signWithWallet(wallet);
    // validate the key signature and return wallet address
    const address = wPub.walletSignatureAddress();
    assert.equal(address, wallet.address);
  });
  it('encrypts private key bundle for storage using a wallet', async function () {
    // create a wallet using a generated key
    const [wPri] = utils.generateKeys();
    const wallet = new ethers.Wallet(wPri.bytes);
    // generate key bundle
    const [pri] = await utils.generateBundles();
    // encrypt and serialize the bundle for storage
    const bytes = await pri.encode(wallet);
    // decrypt and decode the bundle from storage
    const pri2 = await PrivateKeyBundle.decode(wallet, bytes);
    assert.ok(utils.equalBytes(pri.identityKey.bytes, pri2.identityKey.bytes));
    assert.ok(utils.equalBytes(pri.preKey.bytes, pri2.preKey.bytes));
  });
});
