import assert from 'assert';
import { TextEncoder, TextDecoder } from 'util';
import * as crypto from '../src/crypto';

describe('Testing', function() {
  it('should run a test in xmtp-client-messaging', function() {
    assert.equal(123, 123);
  });
});


describe('Crypto', function() {
  it('sign keys and verify signatures', async function() {
    var [iPri, iPub] = crypto.generateKeys();
    var [_, pPub] = crypto.generateKeys();
    await iPri.signKey(pPub);
    assert.ok(await iPub.verifyKey(pPub));
  });
  it('encrypts and decrypts messages', async function() {
    var [aPri, aPub] = crypto.generateKeys();
    var [bPri, bPub] = crypto.generateKeys();
    var msg1 = "Yo!";
    var decrypted = new TextEncoder().encode(msg1);
    var [encrypted, salt, nonce] = await aPri.encrypt(decrypted,bPub);
    decrypted = await bPri.decrypt(encrypted, aPub, salt, nonce);
    var msg2 = new TextDecoder().decode(decrypted);
    assert.equal(msg2, msg1);
  })
});