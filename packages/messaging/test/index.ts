import assert from 'assert';
import { TextEncoder, TextDecoder } from 'util';
import * as crypto from '../src/crypto';

describe('Testing', function() {
  it('should run a test in xmtp-client-messaging', function() {
    assert.equal(123, 123);
  });
});


describe('Crypto', function() {
  it('signs keys and verifies signatures', async function() {
    // Identity Key
    var [iPri, iPub] = crypto.generateKeys();
    // Pre-Key
    var [_, pPub] = crypto.generateKeys();
    await iPri.signKey(pPub);
    assert.ok(await iPub.verifyKey(pPub));
  });
  it('encrypts and decrypts messages', async function() {
    // Alice
    var [aPri, aPub] = crypto.generateKeys();
    // Bob
    var [bPri, bPub] = crypto.generateKeys();
    var msg1 = "Yo!";
    var decrypted = new TextEncoder().encode(msg1);
    // Alice encrypts msg for Bob.
    var [encrypted, salt, nonce] = await aPri.encrypt(decrypted,bPub);
    // Bob decrypts msg from Alice.
    var decrypted2 = await bPri.decrypt(encrypted, aPub, salt, nonce);
    var msg2 = new TextDecoder().decode(decrypted2);
    assert.equal(msg2, msg1);
  })
});