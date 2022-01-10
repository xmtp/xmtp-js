import assert from 'assert';
import * as crypto from '../src/crypto';

describe('Testing', function() {
  it('should run a test in xmtp-client-messaging', function() {
    assert.equal(123, 123);
  });
});


describe('Crypto', function() {
  it('sign keys and verify signatures', async function() {
    var [iPri, iPub] = crypto.generateKeys()
    var [_, pPub] = crypto.generateKeys()
    await iPri.signKey(pPub)
    assert.ok(await iPub.verifyKey(pPub))
  });
});