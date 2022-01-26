import * as assert from 'assert';
import { TextEncoder, TextDecoder } from 'util';
import {
  PublicKeyBundle,
  PrivateKeyBundle,
  PrivateKey,
  PublicKey,
  utils,
  encrypt,
  decrypt
} from '../../src/crypto';
import * as ethers from 'ethers';

describe('Crypto', function () {
  it('signs keys and verifies signatures', async function () {
    const identityKey = PrivateKey.generate();
    const preKey = PrivateKey.generate();
    await identityKey.signKey(preKey.publicKey);
    assert.ok(await identityKey.publicKey.verifyKey(preKey.publicKey));
  });
  it('encrypts and decrypts payload', async function () {
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
    assert.equal(address, '0x0BED7ABd61247635c1973eB38474A2516eD1D884');
  });
  it('encrypts and decrypts payload with key bundles', async function () {
    const alice = await PrivateKeyBundle.generate();
    const bob = await PrivateKeyBundle.generate();
    const msg1 = 'Yo!';
    const decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    let secret = await alice.sharedSecret(bob.publicKeyBundle, false);
    const encrypted = await encrypt(decrypted, secret);
    // Bob decrypts msg from Alice.
    secret = await bob.sharedSecret(alice.publicKeyBundle, true);
    const decrypted2 = await decrypt(encrypted, secret);
    const msg2 = new TextDecoder().decode(decrypted2);
    assert.equal(msg2, msg1);
  });
  it('serializes and desirializes keys and signatures', async function () {
    const alice = await PrivateKeyBundle.generate();
    const bytes = alice.publicKeyBundle.toBytes();
    assert.ok(bytes.length >= 213);
    const pub2 = PublicKeyBundle.fromBytes(bytes);
    assert.ok(pub2.identityKey);
    assert.ok(pub2.preKey);
    assert.ok(pub2.identityKey.verifyKey(pub2.preKey));
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
