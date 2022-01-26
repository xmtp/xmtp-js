import * as assert from 'assert';
import { TextEncoder, TextDecoder } from 'util';
import {
  KeyBundle,
  PrivateKeyBundle,
  PrivateKey,
  PublicKey,
  utils
} from '../../src/crypto';
import * as ethers from 'ethers';
import Message from '../../src/Message';

describe('Crypto', function () {
  it('signs keys and verifies signatures', async function () {
    const identityKey = PrivateKey.generate();
    const preKey = PrivateKey.generate();
    await identityKey.signKey(preKey.publicKey);
    assert.ok(await identityKey.publicKey.verifyKey(preKey.publicKey));
  });
  it('encrypts and decrypts messages', async function () {
    const alice = PrivateKey.generate();
    const bob = PrivateKey.generate();
    const msg1 = 'Yo!';
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await alice.encrypt(decrypted, bob.publicKey);
    // Bob decrypts msg from Alice.
    const decrypted2 = await bob.decrypt(encrypted, alice.publicKey);
    const msg2 = new TextDecoder().decode(decrypted2);
    assert.equal(msg2, msg1);
  });
  it('detects tampering with encrypted message', async function () {
    const alice = PrivateKey.generate();
    const bob = PrivateKey.generate();
    const msg1 = 'Yo!';
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await alice.encrypt(decrypted, bob.publicKey);
    // Malory tampers with the message
    assert.ok(encrypted.aes256GcmHkdfSha256);
    encrypted.aes256GcmHkdfSha256.payload[2] ^= 4; // flip one bit
    // Bob attempts to decrypt msg from Alice.
    try {
      await bob.decrypt(encrypted, alice.publicKey);
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e instanceof Error);
      // Note: This is Node behavior, not sure what browsers will do.
      assert.equal(e.toString(), 'Error: Cipher job failed');
    }
  });
  it('derives public key from signature', async function () {
    const pri = PrivateKey.generate();
    const digest = utils.getRandomValues(new Uint8Array(16));
    const sig = await pri.sign(digest);
    const sigPub = sig.getPublicKey(digest);
    assert.ok(sigPub);
    assert.ok(sigPub.secp256k1Uncompressed);
    assert.ok(pri.publicKey.secp256k1Uncompressed);
    assert.deepEqual(
      sigPub.secp256k1Uncompressed.bytes,
      pri.publicKey.secp256k1Uncompressed.bytes
    );
  });
  it('derives address from public key', function () {
    // using the sample from https://kobl.one/blog/create-full-ethereum-keypair-and-address/
    const bytes = utils.hexToBytes(
      '04836b35a026743e823a90a0ee3b91bf615c6a757e2b60b9e1dc1826fd0dd16106f7bc1e8179f665015f43c6c81f39062fc2086ed849625c06e04697698b21855e'
    );
    const pub = new PublicKey({
      secp256k1Uncompressed: { bytes }
    });
    const address = pub.getEthereumAddress();
    assert.equal(address, '0x0bed7abd61247635c1973eb38474a2516ed1d884');
  });
  it('encrypts and decrypts messages with key bundles', async function () {
    const alice = await PrivateKeyBundle.generate();
    const bob = await PrivateKeyBundle.generate();
    const msg1 = 'Yo!';
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    const encrypted = await Message.encrypt(
      decrypted,
      alice,
      bob.publicKeyBundle
    );
    // Bob decrypts msg from Alice.
    const decrypted2 = await Message.decrypt(
      encrypted,
      alice.publicKeyBundle,
      bob
    );
    const msg2 = new TextDecoder().decode(decrypted2);
    assert.equal(msg2, msg1);
  });
  it('serializes and desirializes keys and signatures', async function () {
    const alice = await PrivateKeyBundle.generate();
    const bytes = alice.publicKeyBundle.toBytes();
    assert.ok(bytes.length >= 213);
    const pub2 = KeyBundle.fromBytes(bytes);
    assert.ok(pub2.identityKey);
    assert.ok(pub2.preKey);
    assert.ok(pub2.identityKey.verifyKey(pub2.preKey));
  });
  it('fully encodes/decodes messages', async function () {
    const aliceWalletKey = PrivateKey.generate();
    assert.ok(aliceWalletKey.secp256k1);
    const aliceWallet = new ethers.Wallet(aliceWalletKey.secp256k1.bytes);
    // Alice's key bundle
    const alice = await PrivateKeyBundle.generate();
    const alicePub = alice.publicKeyBundle;
    assert.ok(alice.identityKey);
    assert.deepEqual(alice.identityKey.publicKey, alicePub.identityKey);
    // sign Alice's identityKey with her wallet
    assert.ok(alicePub.identityKey);
    await alicePub.identityKey.signWithWallet(aliceWallet);
    // Bob
    const bob = await PrivateKeyBundle.generate();
    const msg1 = await Message.encode(alice, bob.publicKeyBundle, 'Yo!');
    const msg2 = await Message.decode(bob, msg1.toBytes());
    assert.equal(msg1.decrypted, 'Yo!');
    assert.equal(msg1.decrypted, msg2.decrypted);

    let address = alicePub.identityKey.walletSignatureAddress();
    assert.equal(address, aliceWallet.address);

    assert.ok(msg1.header?.sender?.identityKey);
    address = new PublicKey(
      msg1.header.sender.identityKey
    ).walletSignatureAddress();
    assert.equal(address, aliceWallet.address);

    assert.ok(msg2.header?.sender?.identityKey);
    address = new PublicKey(
      msg2.header.sender.identityKey
    ).walletSignatureAddress();
    assert.equal(address, aliceWallet.address);
  });
  it('signs keys using a wallet', async function () {
    // create a wallet using a generated key
    const alice = PrivateKey.generate();
    assert.ok(alice.secp256k1);
    const wallet = new ethers.Wallet(alice.secp256k1.bytes);
    // sanity check that we agree with the wallet about the address
    assert.ok(wallet.address, alice.publicKey.getEthereumAddress());
    // sign the public key using the wallet
    await alice.publicKey.signWithWallet(wallet);
    // validate the key signature and return wallet address
    const address = alice.publicKey.walletSignatureAddress();
    assert.equal(address, wallet.address);
  });
  it('encrypts private key bundle for storage using a wallet', async function () {
    // create a wallet using a generated key
    const alice = PrivateKey.generate();
    assert.ok(alice.secp256k1);
    const wallet = new ethers.Wallet(alice.secp256k1.bytes);
    // generate key bundle
    const bob = await PrivateKeyBundle.generate();
    // encrypt and serialize the bundle for storage
    const bytes = await bob.encode(wallet);
    // decrypt and decode the bundle from storage
    const bobDecoded = await PrivateKeyBundle.decode(wallet, bytes);
    assert.ok(bob.identityKey);
    assert.ok(bobDecoded.identityKey);
    assert.ok(bob.identityKey.secp256k1);
    assert.ok(bobDecoded.identityKey.secp256k1);
    assert.deepEqual(
      bob.identityKey.secp256k1.bytes,
      bobDecoded.identityKey.secp256k1.bytes
    );
    assert.ok(bob.preKey.secp256k1);
    assert.ok(bobDecoded.preKey.secp256k1);
    assert.deepEqual(
      bob.preKey.secp256k1.bytes,
      bobDecoded.preKey.secp256k1.bytes
    );
  });
});
