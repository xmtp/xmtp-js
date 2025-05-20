import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import type { Client } from "@/Client";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

const randomDelay = <T = unknown>(
  callback: (...args: unknown[]) => Promise<T>,
  maxDelay: number = 10000,
) => {
  return new Promise<T>((resolve) => {
    const delay = Math.floor(Math.random() * maxDelay);
    setTimeout(() => {
      void callback().then((value) => {
        resolve(value);
      });
    }, delay);
  });
};

const createRegisteredTestClients = async (numClients: number) => {
  return Promise.all(
    Array.from({ length: numClients }).map(async () => {
      const signer = createSigner(createUser());
      return createRegisteredClient(signer);
    }),
  );
};

const createGroupsAndSendMessages = async (
  mainClient: Client,
  numTestClients: number,
  numGroups: number,
  numMessages: number,
) => {
  // create test clients
  const testClients = await createRegisteredTestClients(numTestClients);

  // create test groups
  return Promise.all(
    Array.from({ length: numGroups }).map(async () => {
      // get a random number of test clients, up to 10
      const numTestClientsToAdd = Math.floor(Math.random() * 10);
      // copy, shuffle and slice the test clients for adding to group
      const testClientsToAdd = testClients
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, numTestClientsToAdd);
      // create the group
      const group = await randomDelay(() =>
        mainClient.conversations.newGroup(
          testClientsToAdd.map((c) => c.inboxId),
        ),
      );
      // sync all test clients
      await Promise.all(testClientsToAdd.map((c) => c.conversations.sync()));
      // get conversation on all test clients
      const testGroups = await Promise.all(
        testClientsToAdd.map((c) =>
          c.conversations.getConversationById(group.id),
        ),
      );
      return Promise.all(
        testGroups.map((testGroup) => {
          // get the conversation on the test client
          if (!testGroup) {
            throw new Error("Test group not found");
          }
          return Promise.all(
            Array.from({ length: numMessages }).map(async () => {
              return randomDelay(() => testGroup.send("gm"));
            }),
          );
        }),
      );
    }),
  );
};

describe("E2E: Installation syncing", () => {
  it("should sync across multiple installations", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const client3 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
  });
});
