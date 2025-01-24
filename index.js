// encryptDecryptExample.js

const { PrivateKeyBundleV1, SignedPublicKeyBundle } = require("@xmtp/proto");
const { InMemoryKeystore, InMemoryPersistence } = require("./path/to/your/keystore");
const { newWallet, dateToNs } = require("./path/to/your/utils");

async function runExample() {
  // Step 1: Generate key bundles for sender and recipient
  const senderKeys = await PrivateKeyBundleV1.generate(newWallet());
  const recipientKeys = await PrivateKeyBundleV1.generate(newWallet());

  // Create keystores for sender and recipient
  const senderKeystore = await InMemoryKeystore.create(
    senderKeys,
    InMemoryPersistence.create(),
  );
  const recipientKeystore = await InMemoryKeystore.create(
    recipientKeys,
    InMemoryPersistence.create(),
  );

  // Step 2: Create an invite to establish a shared topic
  const recipientPublicKeyBundle = SignedPublicKeyBundle.fromLegacyBundle(
    recipientKeys.getPublicKeyBundle(),
  );
  const createdNs = dateToNs(new Date());
  const inviteResponse = await senderKeystore.createInvite({
    recipient: recipientPublicKeyBundle,
    createdNs,
    context: undefined,
    consentProof: undefined,
  });

  // Step 3: Encrypt the message
  const payload = new TextEncoder().encode("Hello, world!");
  const headerBytes = new Uint8Array(10);
  const { responses: [encrypted] } = await senderKeystore.encryptV2({
    requests: [
      {
        contentTopic: inviteResponse.conversation!.topic,
        payload,
        headerBytes,
      },
    ],
  });

  if (encrypted.error) {
    throw encrypted.error;
  }

  // Step 4: Decrypt the message on the recipient's side
  const { responses: [decrypted] } = await recipientKeystore.decryptV2({
    requests: [
      {
        payload: encrypted.result?.encrypted,
        headerBytes,
        contentTopic: inviteResponse.conversation!.topic,
      },
    ],
  });

  if (decrypted.error) {
    throw decrypted.error;
  }

  // Verify the decrypted message
  console.log(new TextDecoder().decode(decrypted.result!.decrypted)); // "Hello, world!"
}

runExample().catch(console.error);
