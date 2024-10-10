import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { ContentTypeText, TextCodec } from "@xmtp/content-type-text";
import { message } from "@xmtp/proto";
import type { PublishResponse } from "@xmtp/proto/ts/dist/types/message_api/v1/message_api.pb";
import { Wallet } from "ethers";
import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { assert, vi } from "vitest";
import HttpApiClient, { ApiUrls } from "@/ApiClient";
import Client, { Compression, type ClientOptions } from "@/Client";
import { PrivateKey } from "@/crypto/PrivateKey";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import LocalStoragePonyfill from "@/keystore/persistence/LocalStoragePonyfill";
import TopicPersistence from "@/keystore/persistence/TopicPersistence";
import NetworkKeyManager from "@/keystore/providers/NetworkKeyManager";
import NetworkKeystoreProvider from "@/keystore/providers/NetworkKeystoreProvider";
import type { EnvelopeWithMessage } from "@/utils/async";
import { buildUserContactTopic } from "@/utils/topic";
import { ContentTypeTestKey, TestKeyCodec } from "./ContentTypeTestKey";
import {
  newDevClient,
  newLocalHostClient,
  newLocalHostClientWithCustomWallet,
  newWallet,
  waitForUserContact,
} from "./helpers";

type TestCase = {
  name: string;
  newClient: (opts?: Partial<ClientOptions>) => Promise<Client<any>>;
};

const mockEthRequest = vi.hoisted(() => vi.fn());
vi.mock("@/utils/ethereum", () => {
  return {
    __esModule: true,
    getEthereum: vi.fn(() => {
      const ethereum: any = {
        request: mockEthRequest,
      };
      ethereum.providers = [ethereum];
      ethereum.detected = [ethereum];
      ethereum.isMetaMask = true;
      return ethereum;
    }),
  };
});

describe("Client", () => {
  const tests: TestCase[] = [
    {
      name: "local host node",
      newClient: newLocalHostClient,
    },
    {
      name: "local host node with non-ethers wallet",
      newClient: newLocalHostClientWithCustomWallet,
    },
  ];

  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: "dev",
      newClient: newDevClient,
    });
  }
  tests.forEach((testCase) => {
    describe(testCase.name, () => {
      let alice: Client, bob: Client;

      beforeEach(async () => {
        alice = await testCase.newClient({ publishLegacyContact: true });
        bob = await testCase.newClient({ publishLegacyContact: true });
        await waitForUserContact(alice, alice);
        await waitForUserContact(bob, bob);
      });

      it("user contacts published", async () => {
        const alicePublic = await alice.getUserContact(alice.address);
        expect(alicePublic).toEqual(alice.publicKeyBundle);
        const bobPublic = await bob.getUserContact(bob.address);
        expect(bobPublic).toEqual(bob.publicKeyBundle);
      });

      it("user contacts are filtered to valid contacts", async () => {
        // publish bob's keys to alice's contact topic
        const bobPublic = bob.publicKeyBundle;
        await alice.publishEnvelopes([
          {
            message: bobPublic.toBytes(),
            contentTopic: buildUserContactTopic(alice.address),
          },
        ]);
        const alicePublic = await alice.getUserContact(alice.address);
        expect(alicePublic).toEqual(alice.publicKeyBundle);
      });

      it("Check address can be sent to", async () => {
        const canMessageA = await alice.canMessage("NOT AN ADDRESS");
        expect(canMessageA).toBe(false);

        const canMessageB = await alice.canMessage(bob.address);
        expect(canMessageB).toBe(true);

        const lower = await alice.canMessage(bob.address.toLowerCase());
        expect(lower).toBe(true);
      });
    });
  });
});

describe("bootstrapping", () => {
  let alice: Wallet;

  beforeEach(async () => {
    alice = newWallet();
  });

  it("can bootstrap with a new wallet and persist the private key bundle", async () => {
    const client = await Client.create(alice, { env: "local" });
    const manager = new NetworkKeyManager(
      alice,
      new TopicPersistence(client.apiClient),
    );
    const loadedBundle = await manager.loadPrivateKeyBundle();
    expect(loadedBundle).toBeInstanceOf(PrivateKeyBundleV1);
    expect(
      loadedBundle?.identityKey.publicKey.walletSignatureAddress(),
    ).toEqual(alice.address);
  });

  it("fails to load if no valid keystore provider is available", async () => {
    expect(
      Client.create(alice, { env: "local", keystoreProviders: [] }),
    ).rejects.toThrow("No keystore providers available");
  });

  it("is able to bootstrap from the network", async () => {
    const opts: Partial<ClientOptions> = { env: "local" };
    // Create with the default keystore providers to ensure bootstrapping
    const firstClient = await Client.create(alice, opts);

    const secondClient = await Client.create(alice, {
      ...opts,
      keystoreProviders: [new NetworkKeystoreProvider()],
    });
    expect(secondClient).toBeInstanceOf(Client);
    expect(secondClient.address).toEqual(firstClient.address);
  });

  it("is able to bootstrap from a predefined private key", async () => {
    const opts: Partial<ClientOptions> = { env: "local" };
    const keys = await Client.getKeys(alice, opts);

    const client = await Client.create(null, {
      ...opts,
      privateKeyOverride: keys,
    });
    expect(client.address).toEqual(alice.address);
  });
});

describe("skipContactPublishing", () => {
  it("skips publishing when flag is set to true", async () => {
    const alice = newWallet();
    await Client.create(alice, { skipContactPublishing: true, env: "local" });
    expect(
      await Client.canMessage(alice.address, { env: "local" }),
    ).toBeFalsy();
  });

  it("publishes contact when flag is false", async () => {
    const alice = newWallet();
    await Client.create(alice, { skipContactPublishing: false, env: "local" });
    expect(
      await Client.canMessage(alice.address, { env: "local" }),
    ).toBeTruthy();
  });
});

describe("encodeContent", () => {
  it("passes deflate compression option through properly", async function () {
    const c = await newLocalHostClient();
    const utf8Encode = new TextEncoder();
    const uncompressed = utf8Encode.encode("hello world ".repeat(20));

    const compressed = Uint8Array.from([
      10, 18, 10, 8, 120, 109, 116, 112, 46, 111, 114, 103, 18, 4, 116, 101,
      120, 116, 24, 1, 18, 17, 10, 8, 101, 110, 99, 111, 100, 105, 110, 103, 18,
      5, 85, 84, 70, 45, 56, 40, 0, 34, 48, 120, 156, 51, 52, 48, 209, 49, 52,
      48, 212, 49, 52, 176, 128, 96, 67, 67, 29, 99, 35, 29, 67, 67, 75, 48,
      211, 208, 208, 4, 42, 101, 0, 22, 30, 85, 61, 170, 122, 84, 53, 237, 85,
      3, 0, 139, 43, 173, 229,
    ]);

    const { payload } = await c.encodeContent(uncompressed, {
      compression: Compression.COMPRESSION_DEFLATE,
    });
    expect(Uint8Array.from(payload)).toEqual(compressed);
  });

  it("returns shouldPush based on content codec", async () => {
    const alice = await newLocalHostClient();
    alice.registerCodec(new TestKeyCodec());

    const { shouldPush: result1 } = await alice.encodeContent("gm");
    expect(result1).toBe(true);

    const key = PrivateKey.generate().publicKey;
    const { shouldPush: result2 } = await alice.encodeContent(key, {
      contentType: ContentTypeTestKey,
    });
    expect(result2).toBe(false);
  });
});

describe("canMessage", () => {
  it("can confirm a user is on the network statically", async () => {
    const registeredClient = await newLocalHostClient({
      codecs: [new TextCodec()],
    });
    await waitForUserContact(registeredClient, registeredClient);
    const canMessageRegisteredClient = await Client.canMessage(
      registeredClient.address,
      {
        env: "local",
      },
    );
    expect(canMessageRegisteredClient).toBeTruthy();

    const canMessageUnregisteredClient = await Client.canMessage(
      newWallet().address,
      { env: "local" },
    );
    expect(canMessageUnregisteredClient).toBeFalsy();
  });
});

describe("canMessageBatch", () => {
  it("can confirm multiple users are on the network statically", async () => {
    // Create 10 registered clients
    const registeredClients = await Promise.all(
      Array.from({ length: 10 }, () => newLocalHostClient()),
    );
    // Wait for all clients to be registered
    await Promise.all(
      registeredClients.map((client) => waitForUserContact(client, client)),
    );
    // Now call canMessage with all of the peerAddresses
    const canMessageRegisteredClients = await Client.canMessage(
      registeredClients.map((client) => client.address),
      {
        env: "local",
      },
    );
    // Expect all of the clients to be registered, so response should be all True
    expect(canMessageRegisteredClients).toEqual(
      registeredClients.map(() => true),
    );

    const canMessageUnregisteredClient = await Client.canMessage(
      [newWallet().address],
      { env: "local" },
    );
    expect(canMessageUnregisteredClient).toEqual([false]);
  });
});

describe("canMessageMultipleBatches", () => {
  it("can confirm many multiple users are on the network statically", async () => {
    const registeredClients = await Promise.all(
      Array.from({ length: 10 }, () => newLocalHostClient()),
    );
    // Wait for all clients to be registered
    await Promise.all(
      registeredClients.map((client) => waitForUserContact(client, client)),
    );
    // Repeat registeredClients 8 times to arrive at 80 addresses
    const initialPeerAddresses = registeredClients.map(
      (client) => client.address,
    );
    const repeatedPeerAddresses: string[] = [];
    for (let i = 0; i < 8; i++) {
      repeatedPeerAddresses.push(...initialPeerAddresses);
    }
    // Add 5 fake addresses
    repeatedPeerAddresses.push(
      ...Array.from(
        { length: 5 },
        () => "0x0000000000000000000000000000000000000000",
      ),
    );

    // Now call canMessage with all of the peerAddresses
    const canMessageRegisteredClients = await Client.canMessage(
      repeatedPeerAddresses,
      {
        env: "local",
      },
    );
    // Expect 80 True and 5 False
    expect(canMessageRegisteredClients).toEqual(
      Array.from({ length: 80 }, () => true).concat(
        Array.from({ length: 5 }, () => false),
      ),
    );
  });
});

describe("listEnvelopes", () => {
  it("has envelopes with senderHmac and shouldPush", async () => {
    const alice = await newLocalHostClient();
    const bob = await newLocalHostClient();
    alice.registerCodec(new TestKeyCodec());
    const convo = await alice.conversations.newConversation(bob.address);
    await convo.send("hi");
    const key = PrivateKey.generate().publicKey;
    await convo.send(key, {
      contentType: ContentTypeTestKey,
    });

    const envelopes = await alice.listEnvelopes(
      convo.topic,
      (env: EnvelopeWithMessage) => Promise.resolve(env),
    );

    const msg1 = message.Message.decode(envelopes[0].message);
    if (!msg1.v2) {
      throw new Error("unknown message version");
    }
    const header1 = message.MessageHeaderV2.decode(msg1.v2.headerBytes);
    expect(header1.topic).toEqual(convo.topic);
    expect(msg1.v2.senderHmac).toBeDefined();
    expect(msg1.v2.shouldPush).toBe(true);

    const msg2 = message.Message.decode(envelopes[1].message);
    if (!msg2.v2) {
      throw new Error("unknown message version");
    }
    const header2 = message.MessageHeaderV2.decode(msg2.v2.headerBytes);
    expect(header2.topic).toEqual(convo.topic);
    expect(msg2.v2.senderHmac).toBeDefined();
    expect(msg2.v2.shouldPush).toBe(false);
  });
});

describe("publishEnvelopes", () => {
  it("can send a valid envelope", async () => {
    const c = await newLocalHostClient();
    const envelope = {
      contentTopic: "/xmtp/0/foo/proto",
      message: new TextEncoder().encode("hello world"),
      timestamp: new Date(),
    };
    await c.publishEnvelopes([envelope]);
  });

  it("rejects with invalid envelopes", async () => {
    const c = await newLocalHostClient();
    // Set a bogus authenticator so we can have failing publishes
    c.apiClient.setAuthenticator({
      // @ts-expect-error mock function
      createToken: async () => ({
        toBase64: () => "derp!",
      }),
    });
    const envelope = {
      contentTopic: buildUserContactTopic(c.address),
      message: new TextEncoder().encode("hello world"),
      timestamp: new Date(),
    };

    expect(c.publishEnvelopes([envelope])).rejects.toThrow();
  });
});

describe("ClientOptions", () => {
  const tests = [
    {
      name: "local docker node",
      newClient: newLocalHostClient,
    },
  ];
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: "dev",
      newClient: newDevClient,
    });
  }
  tests.forEach((testCase) => {
    it("Default/empty options", async () => {
      await testCase.newClient();
    });

    it("Partial specification", async () => {
      await testCase.newClient({
        persistConversations: true,
      });
    });
  });

  describe("custom codecs", () => {
    it("gives type errors when you use the wrong types", async () => {
      const client = await Client.create(newWallet(), { env: "local" });
      const other = await Client.create(newWallet(), { env: "local" });
      const convo = await client.conversations.newConversation(other.address);
      expect(convo).toBeTruthy();
      try {
        // @ts-expect-error if we break the type casting someone will notice
        await convo.send(123);
        const messages = await convo.messages();
        for (const message of messages) {
          // @ts-expect-error Strings don't have this kind of method
          message.toFixed();
        }
      } catch (e) {
        return;
      }
      assert.fail();
    });

    it("allows you to use custom content types", async () => {
      const ContentTypeCustom = new ContentTypeId({
        authorityId: "xmtp.org",
        typeId: "text",
        versionMajor: 1,
        versionMinor: 0,
      });
      class CustomCodec implements ContentCodec<{ custom: string }> {
        get contentType(): ContentTypeId {
          return ContentTypeCustom;
        }

        encode(content: { custom: string }): EncodedContent {
          return {
            type: ContentTypeText,
            parameters: {},
            content: new TextEncoder().encode(JSON.stringify(content)),
          };
        }

        decode(content: EncodedContent): { custom: string } {
          const decodedContent = new TextDecoder().decode(content.content);
          const parsedContent = JSON.parse(decodedContent) as {
            custom: string;
          };
          return {
            custom: parsedContent.custom,
          };
        }

        fallback() {
          return undefined;
        }

        shouldPush() {
          return false;
        }
      }

      const client = await Client.create(newWallet(), {
        codecs: [new CustomCodec()],
        env: "local",
      });
      const other = await Client.create(newWallet(), { env: "local" });
      const convo = await client.conversations.newConversation(other.address);
      expect(convo).toBeTruthy();
      // This will have a type error if the codecs field isn't being respected
      await convo.send({ custom: "test" });
    });
  });

  describe("Pluggable API client", () => {
    it("allows you to specify a custom API client factory", async () => {
      const expectedError = new Error("CustomApiClient");
      class CustomApiClient extends HttpApiClient {
        publish(): Promise<PublishResponse> {
          return Promise.reject(expectedError);
        }
      }

      const c = newLocalHostClient({
        apiClientFactory: () => {
          return new CustomApiClient(ApiUrls.local);
        },
      });
      await expect(c).rejects.toThrow(expectedError);
    });
  });

  describe("pluggable persistence", () => {
    it("allows for an override of the persistence engine", async () => {
      class MyNewPersistence extends InMemoryPersistence {
        getItem(): Promise<Uint8Array | null> {
          return Promise.reject(new Error("MyNewPersistence"));
        }
      }

      const c = newLocalHostClient({
        basePersistence: new MyNewPersistence(new LocalStoragePonyfill()),
      });
      await expect(c).rejects.toThrow("MyNewPersistence");
    });
  });

  describe("canGetKeys", () => {
    it("returns true if the useSnaps flag is false", async () => {
      mockEthRequest.mockRejectedValue(new Error("foo"));
      const isSnapsReady = await Client.isSnapsReady();
      expect(isSnapsReady).toBe(false);
    });

    it("returns false if the user has a Snaps capable browser and snaps are enabled", async () => {
      mockEthRequest.mockResolvedValue([]);
      const isSnapsReady = await Client.isSnapsReady();
      expect(isSnapsReady).toBe(true);
    });
  });

  describe("viem", () => {
    it("allows you to use a viem WalletClient", async () => {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);

      const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(),
      });

      const c = await Client.create(walletClient, { env: "local" });
      expect(c).toBeDefined();
      expect(c.address).toEqual(account.address);
    });

    it("creates an identical client between viem and ethers", async () => {
      const randomWallet = Wallet.createRandom();
      const privateKey = randomWallet.privateKey;
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(),
      });

      const viemClient = await Client.create(walletClient, { env: "local" });
      const ethersClient = await Client.create(randomWallet, { env: "local" });
      expect(viemClient.address).toEqual(ethersClient.address);
      expect(
        viemClient.publicKeyBundle.equals(ethersClient.publicKeyBundle),
      ).toBe(true);
    });

    it("fails if you use a viem WalletClient without an account", async () => {
      const walletClient = createWalletClient({
        chain: mainnet,
        transport: http(),
      });

      await expect(
        Client.create(walletClient, { env: "local" }),
      ).rejects.toThrow("WalletClient is not configured");
    });
  });
});
