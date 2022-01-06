import * as assert from 'assert';
import * as crypto from '../src/crypto';

describe('Testing', function() {
  it('should run a test in xmtp-client-messaging', function() {
    assert.equal(123, 123);
  });
});


describe('Crypto', function() {
  it('sign keys and verify signatures', function() {
    var [iPri, iPub] = crypto.generateKeys()
    var [_, pPub] = crypto.generateKeys()
    iPri.signKey(pPub)
    .then(key => iPub.verifyKey(key))
    .then(valid => assert.equal(valid, true, "signature valid"))
    .catch(reason => assert.fail(reason));
  });
});