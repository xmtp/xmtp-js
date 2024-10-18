import { keystore, privateKey } from "@xmtp/proto";
import type { CreateInviteResponse } from "@xmtp/proto/ts/dist/types/keystore_api/v1/keystore.pb";
import Long from "long";
import { toBytes } from "viem";
import { assert } from "vitest";
import Token from "@/authn/Token";
import {
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from "@/crypto/PrivateKeyBundle";
import { SignedPublicKeyBundle } from "@/crypto/PublicKeyBundle";
import { equalBytes } from "@/crypto/utils";
import {
  generateHmacSignature,
  hkdfHmacKey,
  importHmacKey,
  verifyHmacSignature,
} from "@/encryption";
import {
  InvitationV1,
  SealedInvitation,
  type InvitationContext,
} from "@/Invitation";
import { decryptV1 } from "@/keystore/encryption";
import { KeystoreError } from "@/keystore/errors";
import InMemoryKeystore from "@/keystore/InMemoryKeystore";
import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import { getKeyMaterial } from "@/keystore/utils";
import { MessageV1 } from "@/Message";
import { dateToNs, nsToDate } from "@/utils/date";
import { buildProtoEnvelope, newWallet } from "@test/helpers";
import { randomBytes } from "@bench/helpers";

describe("InMemoryKeystore", () => {
  let aliceKeys: PrivateKeyBundleV1;
  let aliceKeystore: InMemoryKeystore;
  let bobKeys: PrivateKeyBundleV1;
  let bobKeystore: InMemoryKeystore;

  beforeEach(async () => {
    aliceKeys = await PrivateKeyBundleV1.generate(newWallet());
    aliceKeystore = await InMemoryKeystore.create(
      aliceKeys,
      InMemoryPersistence.create(),
    );
    bobKeys = await PrivateKeyBundleV1.generate(newWallet());
    bobKeystore = await InMemoryKeystore.create(
      bobKeys,
      InMemoryPersistence.create(),
    );
  });

  const buildInvite = async (context?: InvitationContext) => {
    const invite = InvitationV1.createRandom(context);
    const created = new Date();
    const sealed = await SealedInvitation.createV1({
      sender: PrivateKeyBundleV2.fromLegacyBundle(aliceKeys),
      recipient: SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle(),
      ),
      invitation: invite,
      created,
    });

    return { invite, created, sealed };
  };

  describe("encryptV1", () => {
    it("can encrypt a batch of valid messages", async () => {
      const messages = Array.from({ length: 10 }, (v: unknown, i: number) =>
        new TextEncoder().encode(`message ${i}`),
      );

      const headerBytes = new Uint8Array(10);

      const req = messages.map((msg) => ({
        recipient: bobKeys.getPublicKeyBundle(),
        payload: msg,
        headerBytes,
      }));

      const res = await aliceKeystore.encryptV1({ requests: req });
      expect(res.responses).toHaveLength(req.length);
      for (const { error, result } of res.responses) {
        if (error || !result) {
          throw error;
        }
        const encrypted = result!.encrypted;
        if (!encrypted) {
          throw new Error("No encrypted result");
        }

        expect(result.encrypted?.aes256GcmHkdfSha256?.gcmNonce).toBeTruthy();
        expect(result.encrypted?.aes256GcmHkdfSha256?.hkdfSalt).toBeTruthy();
        expect(result.encrypted?.aes256GcmHkdfSha256?.payload).toBeTruthy();
        // Ensure decryption doesn't throw
        await decryptV1(
          aliceKeys,
          bobKeys.getPublicKeyBundle(),
          encrypted,
          headerBytes,
          true,
        );
      }
    });

    it("fails to encrypt with invalid params", async () => {
      const requests = [
        {
          recipient: {},
          payload: new Uint8Array(10),
          headerBytes: new Uint8Array(10),
        },
      ];

      // @ts-expect-error test case
      const res = await aliceKeystore.encryptV1({ requests });

      expect(res.responses).toHaveLength(requests.length);
      expect(res.responses[0]).toHaveProperty("error");
      expect(res.responses[0].error).toHaveProperty("code");
    });
  });

  describe("decryptV1", () => {
    it("can decrypt a valid message", async () => {
      const msg = new TextEncoder().encode("Hello, world!");
      const peerKeys = bobKeys.getPublicKeyBundle();
      const message = await MessageV1.encode(
        aliceKeystore,
        msg,
        aliceKeys.getPublicKeyBundle(),
        peerKeys,
        new Date(),
      );

      const requests = [
        {
          payload: message.ciphertext,
          peerKeys,
          headerBytes: message.headerBytes,
          isSender: true,
        },
      ];

      const { responses } = await aliceKeystore.decryptV1({ requests });

      expect(responses).toHaveLength(requests.length);
      if (responses[0].error) {
        throw responses[0].error;
      }

      expect(equalBytes(responses[0]!.result!.decrypted, msg)).toBe(true);
    });

    it("fails to decrypt an invalid message", async () => {
      const msg = new TextEncoder().encode("Hello, world!");
      const charlieKeys = await PrivateKeyBundleV1.generate(newWallet());
      const message = await MessageV1.encode(
        bobKeystore,
        msg,
        bobKeys.getPublicKeyBundle(),
        charlieKeys.getPublicKeyBundle(),
        new Date(),
      );

      const requests = [
        {
          payload: message.ciphertext,
          peerKeys: bobKeys.getPublicKeyBundle(),
          headerBytes: message.headerBytes,
          isSender: true,
        },
      ];

      const { responses } = await aliceKeystore.decryptV1({ requests });

      expect(responses).toHaveLength(requests.length);

      if (!responses[0].error) {
        throw new Error("should have errored");
      }
    });
  });

  describe("createInvite", () => {
    it("creates a valid invite with no context", async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle(),
      );
      const createdNs = dateToNs(new Date());
      const response = await aliceKeystore.createInvite({
        recipient,
        createdNs,
        context: undefined,
        consentProof: undefined,
      });

      expect(response.conversation?.topic).toBeTruthy();
      expect(response.conversation?.context).toBeUndefined();
      expect(response.conversation?.createdNs.equals(createdNs)).toBeTruthy();
      expect(response.payload).toBeInstanceOf(Uint8Array);
    });

    it("creates a valid invite with context", async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle(),
      );
      const createdNs = dateToNs(new Date());
      const context = { conversationId: "xmtp.org/foo", metadata: {} };
      const response = await aliceKeystore.createInvite({
        recipient,
        createdNs,
        context,
        consentProof: undefined,
      });

      expect(response.conversation?.topic).toBeTruthy();
      expect(response.conversation?.context).toEqual(context);
    });

    it("throws if an invalid recipient is included", async () => {
      const createdNs = dateToNs(new Date());
      await expect(async () => {
        await aliceKeystore.createInvite({
          recipient: {} as any,
          createdNs,
          context: undefined,
          consentProof: undefined,
        });
      }).rejects.toThrow(KeystoreError);
    });
  });

  describe("saveInvites", () => {
    it("can save a batch of valid envelopes", async () => {
      const keystore = aliceKeystore;
      const { invite, created, sealed } = await buildInvite();

      const sealedBytes = sealed.toBytes();
      const envelope = buildProtoEnvelope(sealedBytes, "foo", created);
      const { responses } = await keystore.saveInvites({
        requests: [envelope],
      });

      expect(responses).toHaveLength(1);
      const firstResult = responses[0];
      if (firstResult.error) {
        throw firstResult.error;
      }

      expect(
        nsToDate(firstResult.result!.conversation!.createdNs).getTime(),
      ).toEqual(created.getTime());
      expect(firstResult.result!.conversation!.topic).toEqual(invite.topic);
      expect(firstResult.result!.conversation?.context).toBeUndefined();

      const conversations = (await keystore.getV2Conversations()).conversations;
      expect(conversations).toHaveLength(1);
      expect(conversations[0].topic).toBe(invite.topic);
    });

    it("can save received invites", async () => {
      const { created, sealed } = await buildInvite();

      const sealedBytes = sealed.toBytes();
      const envelope = buildProtoEnvelope(sealedBytes, "foo", created);

      const {
        responses: [aliceResponse],
      } = await aliceKeystore.saveInvites({
        requests: [envelope],
      });
      if (aliceResponse.error) {
        throw aliceResponse;
      }

      const aliceConversations = (await aliceKeystore.getV2Conversations())
        .conversations;
      expect(aliceConversations).toHaveLength(1);

      const {
        responses: [bobResponse],
      } = await bobKeystore.saveInvites({ requests: [envelope] });
      if (bobResponse.error) {
        throw bobResponse;
      }

      const bobConversations = (await bobKeystore.getV2Conversations())
        .conversations;
      expect(bobConversations).toHaveLength(1);
    });

    it("ignores bad envelopes", async () => {
      const conversationId = "xmtp.org/foo";
      const { invite, created, sealed } = await buildInvite({
        conversationId,
        metadata: {},
      });
      const envelopes = [
        buildProtoEnvelope(new Uint8Array(10), "bar", new Date()),
        buildProtoEnvelope(sealed.toBytes(), "foo", created),
      ];

      const response = await bobKeystore.saveInvites({ requests: envelopes });
      expect(response.responses).toHaveLength(2);

      const {
        responses: [firstResult, secondResult],
      } = response;

      if (!firstResult.error) {
        assert.fail("should have errored");
      }
      expect(firstResult.error.code).toBeTruthy();

      if (secondResult.error) {
        assert.fail("should not have errored");
      }

      expect(
        secondResult.result?.conversation?.createdNs.equals(dateToNs(created)),
      ).toBeTruthy();
      expect(secondResult.result?.conversation?.topic).toEqual(invite.topic);
      expect(
        secondResult.result?.conversation?.context?.conversationId,
      ).toEqual(conversationId);
    });
  });

  describe("encryptV2/decryptV2", () => {
    it("encrypts using a saved envelope", async () => {
      const keystore = aliceKeystore;
      const { invite, created, sealed } = await buildInvite();

      const sealedBytes = sealed.toBytes();
      const envelope = buildProtoEnvelope(sealedBytes, "foo", created);
      await keystore.saveInvites({ requests: [envelope] });

      const payload = new TextEncoder().encode("Hello, world!");
      const headerBytes = new Uint8Array(10);

      const {
        responses: [encrypted],
      } = await keystore.encryptV2({
        requests: [
          {
            contentTopic: invite.topic,
            payload,
            headerBytes,
          },
        ],
      });

      if (encrypted.error) {
        throw encrypted;
      }

      expect(encrypted.result?.encrypted).toBeTruthy();
    });

    it("round trips using a created invite", async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle(),
      );
      const createdNs = dateToNs(new Date());
      const response = await aliceKeystore.createInvite({
        recipient,
        createdNs,
        context: undefined,
        consentProof: undefined,
      });

      const payload = new TextEncoder().encode("Hello, world!");
      const headerBytes = new Uint8Array(10);

      const {
        responses: [encrypted],
      } = await aliceKeystore.encryptV2({
        requests: [
          {
            contentTopic: response.conversation!.topic,
            payload,
            headerBytes,
          },
        ],
      });

      if (encrypted.error) {
        throw encrypted.error;
      }

      expect(encrypted.result?.encrypted).toBeTruthy();

      const {
        responses: [decrypted],
      } = await aliceKeystore.decryptV2({
        requests: [
          {
            payload: encrypted.result?.encrypted,
            headerBytes,
            contentTopic: response.conversation!.topic,
          },
        ],
      });

      if (decrypted.error) {
        throw decrypted.error;
      }

      expect(equalBytes(payload, decrypted.result!.decrypted)).toBeTruthy();
    });

    it("generates a valid sender HMAC", async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle(),
      );
      const createdNs = dateToNs(new Date());
      const response = await aliceKeystore.createInvite({
        recipient,
        createdNs,
        context: undefined,
        consentProof: undefined,
      });

      const payload = new TextEncoder().encode("Hello, world!");
      const headerBytes = new Uint8Array(10);

      const {
        responses: [encrypted],
      } = await aliceKeystore.encryptV2({
        requests: [
          {
            contentTopic: response.conversation!.topic,
            payload,
            headerBytes,
          },
        ],
      });

      if (encrypted.error) {
        throw encrypted.error;
      }

      const thirtyDayPeriodsSinceEpoch = Math.floor(
        Date.now() / 1000 / 60 / 60 / 24 / 30,
      );
      const topicData = aliceKeystore.lookupTopic(response.conversation!.topic);
      const keyMaterial = getKeyMaterial(topicData!.invitation);
      const hmacKey = await hkdfHmacKey(
        keyMaterial,
        new TextEncoder().encode(
          `${thirtyDayPeriodsSinceEpoch}-${aliceKeystore.walletAddress}`,
        ),
      );

      expect(encrypted.result?.senderHmac).toBeTruthy();
      expect(
        await verifyHmacSignature(
          hmacKey,
          encrypted.result!.senderHmac,
          headerBytes,
        ),
      ).toBeTruthy();
    });
  });

  describe("SignDigest", () => {
    it("signs a valid digest with the identity key", async () => {
      const digest = randomBytes(32);
      const signature = await aliceKeystore.signDigest({
        digest,
        identityKey: true,
        prekeyIndex: undefined,
      });
      expect(signature).toEqual(await aliceKeys.identityKey.sign(digest));
    });

    it("rejects an invalid digest", async () => {
      const digest = new Uint8Array(0);
      await expect(
        aliceKeystore.signDigest({
          digest,
          identityKey: true,
          prekeyIndex: undefined,
        }),
      ).rejects.toThrow();
    });

    it("signs a valid digest with a specified prekey", async () => {
      const digest = randomBytes(32);
      const signature = await aliceKeystore.signDigest({
        digest,
        identityKey: false,
        prekeyIndex: 0,
      });
      expect(signature).toEqual(await aliceKeys.preKeys[0].sign(digest));
    });

    it("rejects signing with an invalid prekey index", async () => {
      const digest = randomBytes(32);
      await expect(
        aliceKeystore.signDigest({
          digest,
          identityKey: false,
          prekeyIndex: 100,
        }),
      ).rejects.toThrow(
        new KeystoreError(
          keystore.ErrorCode.ERROR_CODE_NO_MATCHING_PREKEY,
          "no prekey found",
        ),
      );
    });
  });

  describe("getV2Conversations", () => {
    it("correctly sorts conversations", async () => {
      const baseTime = new Date();
      const timestamps = Array.from(
        { length: 25 },
        (_, i) => new Date(baseTime.getTime() + i),
      );

      // Shuffle the order they go into the store
      const shuffled = [...timestamps].sort(() => Math.random() - 0.5);

      await Promise.all(
        shuffled.map(async (createdAt) => {
          const keys = await PrivateKeyBundleV1.generate(newWallet());

          const recipient = SignedPublicKeyBundle.fromLegacyBundle(
            keys.getPublicKeyBundle(),
          );

          return aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: undefined,
            consentProof: undefined,
          });
        }),
      );

      const convos = (await aliceKeystore.getV2Conversations()).conversations;
      let lastCreated = Long.fromNumber(0);
      for (let i = 0; i < convos.length; i++) {
        expect(
          convos[i].createdNs.equals(dateToNs(timestamps[i])),
        ).toBeTruthy();
        expect(
          convos[i].createdNs.greaterThanOrEqual(lastCreated),
        ).toBeTruthy();
        lastCreated = convos[i].createdNs;
      }
    });

    it("uses deterministic topic", async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle(),
      );
      const baseTime = new Date();
      const timestamps = Array.from(
        { length: 25 },
        (_, i) => new Date(baseTime.getTime() + i),
      );

      // Shuffle the order they go into the store
      const shuffled = [...timestamps].sort(() => Math.random() - 0.5);

      const responses: CreateInviteResponse[] = [];
      await Promise.all(
        shuffled.map(async (createdAt) => {
          const response = await aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: undefined,
            consentProof: undefined,
          });

          responses.push(response);

          return response;
        }),
      );

      const firstResponse: CreateInviteResponse = responses[0];
      const topicName = firstResponse.conversation!.topic;

      // eslint-disable-next-line no-control-regex
      expect(topicName).toMatch(/^[\x00-\x7F]+$/);

      expect(
        responses.filter((response) => {
          return response.conversation!.topic === topicName;
        }),
      ).toHaveLength(25);
    });

    it("generates known deterministic topic", async () => {
      aliceKeys = new PrivateKeyBundleV1(
        privateKey.PrivateKeyBundle.decode(
          toBytes(
            "0x0a8a030ac20108c192a3f7923112220a2068d2eb2ef8c50c4916b42ce638c5610e44ff4eb3ecb098" +
              "c9dacf032625c72f101a940108c192a3f7923112460a440a40fc9822283078c323c9319c45e60ab4" +
              "2c65f6e1744ed8c23c52728d456d33422824c98d307e8b1c86a26826578523ba15fe6f04a17fca17" +
              "6664ee8017ec8ba59310011a430a410498dc2315dd45d99f5e900a071e7b56142de344540f07fbc7" +
              "3a0f9a5d5df6b52eb85db06a3825988ab5e04746bc221fcdf5310a44d9523009546d4bfbfbb89cfb" +
              "12c20108eb92a3f7923112220a20788be9da8e1a1a08b05f7cbf22d86980bc056b130c482fa5bd26" +
              "ccb8d29b30451a940108eb92a3f7923112460a440a40a7afa25cb6f3fbb98f9e5cd92a1df1898452" +
              "e0dfa1d7e5affe9eaf9b72dd14bc546d86c399768badf983f07fa7dd16eee8d793357ce6fccd6768" +
              "07d87bcc595510011a430a410422931e6295c3c93a5f6f5e729dc02e1754e916cb9be16d36dc163a" +
              "300931f42a0cd5fde957d75c2068e1980c5f86843daf16aba8ae57e8160b8b9f0191def09e",
          ),
        ).v1!,
      );
      aliceKeystore = await InMemoryKeystore.create(
        aliceKeys,
        InMemoryPersistence.create(),
      );
      bobKeys = new PrivateKeyBundleV1(
        privateKey.PrivateKeyBundle.decode(
          toBytes(
            "0x0a88030ac001088cd68df7923112220a209057f8d813314a2aae74e6c4c30f909c1c496b6037ce32" +
              "a12c613558a8e961681a9201088cd68df7923112440a420a40501ae9b4f75d5bb5bae3ca4ecfda4e" +
              "de9edc5a9b7fc2d56dc7325b837957c23235cc3005b46bb9ef485f106404dcf71247097ed5096355" +
              "90f4b7987b833d03661a430a4104e61a7ae511567f4a2b5551221024b6932d6cdb8ecf3876ec64cf" +
              "29be4291dd5428fc0301963cdf6939978846e2c35fd38fcb70c64296a929f166ef6e4e91045712c2" +
              "0108b8d68df7923112220a2027707399474d417bf6aae4baa3d73b285bf728353bc3e156b0e32461" +
              "ebb48f8c1a940108b8d68df7923112460a440a40fb96fa38c3f013830abb61cf6b39776e0475eb13" +
              "79c66013569c3d2daecdd48c7fbee945dcdbdc5717d1f4ffd342c4d3f1b7215912829751a94e3ae1" +
              "1007e0a110011a430a4104952b7158cfe819d92743a4132e2e3ae867d72f6a08292aebf471d0a7a2" +
              "907f3e9947719033e20edc9ca9665874bd88c64c6b62c01928065f6069c5c80c699924",
          ),
        ).v1!,
      );
      bobKeystore = await InMemoryKeystore.create(
        bobKeys,
        InMemoryPersistence.create(),
      );

      expect(await aliceKeystore.getAccountAddress()).toEqual(
        "0xF56d1F3b1290204441Cb3843C2Cac1C2f5AEd690",
      ); // alice
      expect(bobKeys.getPublicKeyBundle().walletSignatureAddress()).toEqual(
        "0x3De402A325323Bb97f00cE3ad5bFAc96A11F9A34",
      ); // bob
      const aliceInvite = await aliceKeystore.createInvite({
        recipient: SignedPublicKeyBundle.fromLegacyBundle(
          bobKeys.getPublicKeyBundle(),
        ),
        createdNs: dateToNs(new Date()),
        context: {
          conversationId: "test",
          metadata: {},
        },
        consentProof: undefined,
      });
      expect(aliceInvite.conversation!.topic).toEqual(
        "/xmtp/0/m-4b52be1e8567d72d0bc407debe2d3c7fca2ae93a47e58c3f9b5c5068aff80ec5/proto",
      );

      const bobInvite = await bobKeystore.createInvite({
        recipient: SignedPublicKeyBundle.fromLegacyBundle(
          aliceKeys.getPublicKeyBundle(),
        ),
        createdNs: dateToNs(new Date()),
        context: {
          conversationId: "test",
          metadata: {},
        },
        consentProof: undefined,
      });
      expect(bobInvite.conversation!.topic).toEqual(
        "/xmtp/0/m-4b52be1e8567d72d0bc407debe2d3c7fca2ae93a47e58c3f9b5c5068aff80ec5/proto",
      );
    });

    it("uses deterministic topic w/ conversation ID", async () => {
      const recipient = SignedPublicKeyBundle.fromLegacyBundle(
        bobKeys.getPublicKeyBundle(),
      );
      const baseTime = new Date();
      const timestamps = Array.from(
        { length: 25 },
        (_, i) => new Date(baseTime.getTime() + i),
      );

      // Shuffle the order they go into the store
      const shuffled = [...timestamps].sort(() => Math.random() - 0.5);

      const responses: CreateInviteResponse[] = [];
      await Promise.all(
        shuffled.map(async (createdAt) => {
          const response = await aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: {
              conversationId: "test",
              metadata: {},
            },
            consentProof: undefined,
          });

          responses.push(response);

          return response;
        }),
      );

      const firstResponse: CreateInviteResponse = responses[0];
      const topicName = firstResponse.conversation!.topic;

      expect(
        responses.filter((response) => {
          return response.conversation!.topic === topicName;
        }),
      ).toHaveLength(25);
    });

    it("creates deterministic topics bidirectionally", async () => {
      const aliceInvite = await aliceKeystore.createInvite({
        recipient: SignedPublicKeyBundle.fromLegacyBundle(
          bobKeys.getPublicKeyBundle(),
        ),
        createdNs: dateToNs(new Date()),
        context: undefined,
        consentProof: undefined,
      });
      const bobInvite = await bobKeystore.createInvite({
        recipient: SignedPublicKeyBundle.fromLegacyBundle(
          aliceKeys.getPublicKeyBundle(),
        ),
        createdNs: dateToNs(new Date()),
        context: undefined,
        consentProof: undefined,
      });
      expect(
        await aliceKeys.sharedSecret(
          bobKeys.getPublicKeyBundle(),
          aliceKeys.getCurrentPreKey().publicKey,
          false,
        ),
      ).toEqual(
        await bobKeys.sharedSecret(
          aliceKeys.getPublicKeyBundle(),
          bobKeys.getCurrentPreKey().publicKey,
          true,
        ),
      );

      expect(aliceInvite.conversation!.topic).toEqual(
        bobInvite.conversation!.topic,
      );
    });
  });

  describe("createAuthToken", () => {
    it("creates an auth token", async () => {
      const authToken = new Token(await aliceKeystore.createAuthToken({}));
      expect(authToken.authDataBytes).toBeDefined();
      expect(Long.isLong(authToken.authData.createdNs)).toBe(true);
      expect(authToken.authDataSignature).toBeDefined();
      expect(authToken.identityKey?.secp256k1Uncompressed).toBeDefined();
      expect(authToken.identityKey?.signature).toBeDefined();
    });

    it("creates an auth token with a defined time", async () => {
      const definedTime = new Date(+new Date() - 5000);
      const token = new Token(
        await aliceKeystore.createAuthToken({
          timestampNs: dateToNs(definedTime),
        }),
      );
      expect(token.ageMs).toBeGreaterThan(5000);
    });
  });

  describe("getPublicKeyBundle", () => {
    it("can retrieve a valid bundle", async () => {
      const bundle = await aliceKeystore.getPublicKeyBundle();
      const wrappedBundle = SignedPublicKeyBundle.fromLegacyBundle(bundle);
      expect(
        wrappedBundle.equals(
          SignedPublicKeyBundle.fromLegacyBundle(
            aliceKeys.getPublicKeyBundle(),
          ),
        ),
      );
    });
  });

  describe("getAccountAddress", () => {
    it("returns the wallet address", async () => {
      const aliceAddress = aliceKeys
        .getPublicKeyBundle()
        .walletSignatureAddress();
      const returnedAddress = await aliceKeystore.getAccountAddress();

      expect(aliceAddress).toEqual(returnedAddress);
    });
  });

  describe("lookupTopic", () => {
    it("looks up a topic that exists", async () => {
      const { created, sealed, invite } = await buildInvite();

      const sealedBytes = sealed.toBytes();
      const envelope = buildProtoEnvelope(sealedBytes, "foo", created);

      const {
        responses: [aliceResponse],
      } = await aliceKeystore.saveInvites({
        requests: [envelope],
      });
      if (aliceResponse.error) {
        throw aliceResponse;
      }

      const lookupResult = aliceKeystore.lookupTopic(invite.topic);
      expect(
        lookupResult?.invitation?.aes256GcmHkdfSha256?.keyMaterial,
      ).toEqual(invite.aes256GcmHkdfSha256.keyMaterial);
    });

    it("returns undefined for non-existent topic", async () => {
      const lookupResult = aliceKeystore.lookupTopic("foo");
      expect(lookupResult).toBeUndefined();
    });
  });

  describe("getRefreshJob/setRefreshJob", () => {
    it("returns 0 value when empty", async () => {
      const job = await aliceKeystore.getRefreshJob(
        keystore.GetRefreshJobRequest.fromPartial({
          jobType: keystore.JobType.JOB_TYPE_REFRESH_V1,
        }),
      );
      expect(job.lastRunNs.equals(Long.fromNumber(0))).toBeTruthy();
    });

    it("returns a value when set", async () => {
      const lastRunNs = dateToNs(new Date());
      await aliceKeystore.setRefreshJob(
        keystore.SetRefeshJobRequest.fromPartial({
          jobType: keystore.JobType.JOB_TYPE_REFRESH_V1,
          lastRunNs,
        }),
      );

      const result = await aliceKeystore.getRefreshJob(
        keystore.GetRefreshJobRequest.fromPartial({
          jobType: keystore.JobType.JOB_TYPE_REFRESH_V1,
        }),
      );
      expect(result.lastRunNs.equals(lastRunNs)).toBeTruthy();

      const otherJob = await aliceKeystore.getRefreshJob(
        keystore.GetRefreshJobRequest.fromPartial({
          jobType: keystore.JobType.JOB_TYPE_REFRESH_V2,
        }),
      );
      expect(otherJob.lastRunNs.equals(Long.fromNumber(0))).toBeTruthy();
    });

    it("overwrites a value when set", async () => {
      const lastRunNs = dateToNs(new Date());
      await aliceKeystore.setRefreshJob(
        keystore.SetRefeshJobRequest.fromPartial({
          jobType: keystore.JobType.JOB_TYPE_REFRESH_V1,
          lastRunNs: Long.fromNumber(5),
        }),
      );
      await aliceKeystore.setRefreshJob(
        keystore.SetRefeshJobRequest.fromPartial({
          jobType: keystore.JobType.JOB_TYPE_REFRESH_V1,
          lastRunNs,
        }),
      );
      expect(
        (
          await aliceKeystore.getRefreshJob(
            keystore.GetRefreshJobRequest.fromPartial({
              jobType: keystore.JobType.JOB_TYPE_REFRESH_V1,
            }),
          )
        ).lastRunNs.equals(lastRunNs),
      ).toBeTruthy();
    });
  });

  describe("getV2ConversationHmacKeys", () => {
    it("returns all conversation HMAC keys", async () => {
      const baseTime = new Date();
      const timestamps = Array.from(
        { length: 5 },
        (_, i) => new Date(baseTime.getTime() + i),
      );

      const invites = await Promise.all(
        [...timestamps].map(async (createdAt) => {
          const keys = await PrivateKeyBundleV1.generate(newWallet());

          const recipient = SignedPublicKeyBundle.fromLegacyBundle(
            keys.getPublicKeyBundle(),
          );

          return aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: undefined,
            consentProof: undefined,
          });
        }),
      );

      const thirtyDayPeriodsSinceEpoch = Math.floor(
        Date.now() / 1000 / 60 / 60 / 24 / 30,
      );

      const periods = [
        thirtyDayPeriodsSinceEpoch - 1,
        thirtyDayPeriodsSinceEpoch,
        thirtyDayPeriodsSinceEpoch + 1,
      ];

      const { hmacKeys } = await aliceKeystore.getV2ConversationHmacKeys();

      const topics = Object.keys(hmacKeys);
      invites.forEach((invite) => {
        expect(topics.includes(invite.conversation!.topic)).toBeTruthy();
      });

      const topicHmacs: {
        [topic: string]: Uint8Array;
      } = {};
      const headerBytes = new Uint8Array(10);

      await Promise.all(
        invites.map(async (invite) => {
          const topic = invite.conversation!.topic;
          const payload = new TextEncoder().encode("Hello, world!");

          const {
            responses: [encrypted],
          } = await aliceKeystore.encryptV2({
            requests: [
              {
                contentTopic: topic,
                payload,
                headerBytes,
              },
            ],
          });

          if (encrypted.error) {
            throw encrypted.error;
          }

          const topicData = aliceKeystore.lookupTopic(topic);
          const keyMaterial = getKeyMaterial(topicData!.invitation);
          const info = `${thirtyDayPeriodsSinceEpoch}-${aliceKeystore.walletAddress}`;
          const hmac = await generateHmacSignature(
            keyMaterial,
            new TextEncoder().encode(info),
            headerBytes,
          );

          topicHmacs[topic] = hmac;
        }),
      );

      await Promise.all(
        Object.keys(hmacKeys).map(async (topic) => {
          const hmacData = hmacKeys[topic];

          await Promise.all(
            hmacData.values.map(
              async ({ hmacKey, thirtyDayPeriodsSinceEpoch }, idx) => {
                expect(thirtyDayPeriodsSinceEpoch).toBe(periods[idx]);
                const valid = await verifyHmacSignature(
                  await importHmacKey(hmacKey),
                  topicHmacs[topic],
                  headerBytes,
                );
                expect(valid).toBe(idx === 1);
              },
            ),
          );
        }),
      );
    });

    it("returns specific conversation HMAC keys", async () => {
      const baseTime = new Date();
      const timestamps = Array.from(
        { length: 10 },
        (_, i) => new Date(baseTime.getTime() + i),
      );

      const invites = await Promise.all(
        [...timestamps].map(async (createdAt) => {
          const keys = await PrivateKeyBundleV1.generate(newWallet());

          const recipient = SignedPublicKeyBundle.fromLegacyBundle(
            keys.getPublicKeyBundle(),
          );

          return aliceKeystore.createInvite({
            recipient,
            createdNs: dateToNs(createdAt),
            context: undefined,
            consentProof: undefined,
          });
        }),
      );

      const thirtyDayPeriodsSinceEpoch = Math.floor(
        Date.now() / 1000 / 60 / 60 / 24 / 30,
      );

      const periods = [
        thirtyDayPeriodsSinceEpoch - 1,
        thirtyDayPeriodsSinceEpoch,
        thirtyDayPeriodsSinceEpoch + 1,
      ];

      const randomInvites = invites.slice(3, 8);

      const { hmacKeys } = await aliceKeystore.getV2ConversationHmacKeys({
        topics: randomInvites.map((invite) => invite.conversation!.topic),
      });

      const topics = Object.keys(hmacKeys);
      expect(topics.length).toBe(randomInvites.length);
      randomInvites.forEach((invite) => {
        expect(topics.includes(invite.conversation!.topic)).toBeTruthy();
      });

      const topicHmacs: {
        [topic: string]: Uint8Array;
      } = {};
      const headerBytes = new Uint8Array(10);

      await Promise.all(
        randomInvites.map(async (invite) => {
          const topic = invite.conversation!.topic;
          const payload = new TextEncoder().encode("Hello, world!");

          const {
            responses: [encrypted],
          } = await aliceKeystore.encryptV2({
            requests: [
              {
                contentTopic: topic,
                payload,
                headerBytes,
              },
            ],
          });

          if (encrypted.error) {
            throw encrypted.error;
          }

          const topicData = aliceKeystore.lookupTopic(topic);
          const keyMaterial = getKeyMaterial(topicData!.invitation);
          const info = `${thirtyDayPeriodsSinceEpoch}-${aliceKeystore.walletAddress}`;
          const hmac = await generateHmacSignature(
            keyMaterial,
            new TextEncoder().encode(info),
            headerBytes,
          );

          topicHmacs[topic] = hmac;
        }),
      );

      await Promise.all(
        Object.keys(hmacKeys).map(async (topic) => {
          const hmacData = hmacKeys[topic];

          await Promise.all(
            hmacData.values.map(
              async ({ hmacKey, thirtyDayPeriodsSinceEpoch }, idx) => {
                expect(thirtyDayPeriodsSinceEpoch).toBe(periods[idx]);
                const valid = await verifyHmacSignature(
                  await importHmacKey(hmacKey),
                  topicHmacs[topic],
                  headerBytes,
                );
                expect(valid).toBe(idx === 1);
              },
            ),
          );
        }),
      );
    });
  });
});
