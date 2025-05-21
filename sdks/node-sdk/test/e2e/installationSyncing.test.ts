import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import type { Client } from "@/Client";
import type { Group } from "@/Group";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

const CHAOS_GROUPS = 25;
const CHAOS_MESSAGES = 20;
const CHAOS_MEMBERS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createRegisteredTestClients = async (numClients: number) => {
  return Promise.all(
    Array.from({ length: numClients }).map(async () => {
      const signer = createSigner(createUser());
      return createRegisteredClient(signer);
    }),
  );
};

const createChaos = async <T = unknown>(
  mainClient: Client<T>,
  numTestClients: number,
  numGroups: number,
  numMessages: number,
) => {
  const groups: Group<T>[] = [];
  // create test clients
  console.log(`[chaos] starting chaos on client ${mainClient.inboxId}`);
  const testClients = await createRegisteredTestClients(numTestClients);
  console.log(`[chaos] created ${testClients.length} test clients`);
  // create test groups
  await Promise.all(
    Array.from({ length: numGroups }).map(async () => {
      // copy, shuffle and slice the test clients for adding to group
      const testClientsToAdd = testClients
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, CHAOS_MEMBERS);
      // create the group
      const group = await mainClient.conversations.newGroup(
        testClientsToAdd.map((c) => c.inboxId),
      );
      await sleep(Math.floor(Math.random() * 1000));
      console.log(`[chaos] created group with id "${group.id}"`);
      groups.push(group);
      // sync all test clients
      await Promise.all(testClientsToAdd.map((c) => c.conversations.sync()));
      // get conversation on all test clients
      const testGroups = await Promise.all(
        testClientsToAdd.map((c) =>
          c.conversations.getConversationById(group.id),
        ),
      );
      console.log(
        `[chaos] got conversation ${group.id} on ${testGroups.length} clients`,
      );
      await Promise.all(
        testGroups.map(async (testGroup) => {
          // get the conversation on the test client
          if (!testGroup) {
            console.log(`[chaos] test group "${group.id}" not found`);
            return Promise.resolve();
          }
          await Promise.all(
            Array.from({ length: numMessages }).map(async () => {
              await testGroup.send("gm");
              await sleep(Math.floor(Math.random() * 1000));
            }),
          );
        }),
      );
      console.log(
        `[chaos] finished sending messages to test group "${group.id}"`,
      );
    }),
  );
  return groups;
};

const clientSyncAll = <T = unknown>(
  client: Client<T>,
  interval: number = 10000,
) => {
  const syncs: bigint[] = [];
  const intervalId = setInterval(() => {
    void client.conversations.syncAll().then((sync) => {
      console.log(`[sync] synced ${sync} items on ${client.inboxId}`);
      syncs.push(sync);
    });
  }, interval);
  return async () => {
    console.log(`[sync] stopping syncAll on ${client.inboxId}`);
    // clear the interval
    clearInterval(intervalId);
    // sync one last time
    const sync = await client.conversations.syncAll();
    // return the syncs
    return sync;
  };
};

describe("E2E: Installation syncing", () => {
  it(
    "should sync across multiple installations",
    {
      timeout: 300000,
    },
    async () => {
      const user = createUser();
      const signer = createSigner(user);
      // create the first installation
      const installation1 = await createRegisteredClient(signer);
      // start syncing the first installation
      const stopSync1 = clientSyncAll(installation1);
      // create some chaos on installation 1
      const chaos1 = createChaos(
        installation1,
        100,
        CHAOS_GROUPS,
        CHAOS_MESSAGES,
      );

      const installation2 = await createRegisteredClient(signer, {
        dbPath: `./test-${v4()}.db3`,
      });
      // start syncing the second installation
      const stopSync2 = clientSyncAll(installation2);
      // create some chaos on installation 2
      const chaos2 = createChaos(
        installation2,
        100,
        CHAOS_GROUPS,
        CHAOS_MESSAGES,
      );

      // create the third installation
      const installation3 = await createRegisteredClient(signer, {
        dbPath: `./test-${v4()}.db3`,
      });
      // start syncing the third installation
      const stopSync3 = clientSyncAll(installation3);
      // create some chaos on installation 3
      const chaos3 = createChaos(
        installation3,
        100,
        CHAOS_GROUPS,
        CHAOS_MESSAGES,
      );

      const totalGroups = CHAOS_GROUPS * 3;

      // wait for the chaos to end, get the created groups
      const groups = await Promise.all([chaos1, chaos2, chaos3]);
      expect(groups.flat().length).toBe(totalGroups);

      // stop the installation syncs, get the number of synced items
      const [sync1, sync2, sync3] = await Promise.all([
        stopSync1(),
        stopSync2(),
        stopSync3(),
      ]);
      expect(Number(sync1)).toBe(totalGroups + 3);
      expect(Number(sync2)).toBe(totalGroups + 2);
      expect(Number(sync3)).toBe(totalGroups + 1);

      const groups1 = await installation1.conversations.list();
      const groups2 = await installation2.conversations.list();
      const groups3 = await installation3.conversations.list();

      expect(groups1.length).toBe(totalGroups);
      expect(groups2.length).toBe(totalGroups);
      expect(groups3.length).toBe(totalGroups);

      const members1 = await Promise.all(groups1.map((g) => g.members()));
      const members2 = await Promise.all(groups2.map((g) => g.members()));
      const members3 = await Promise.all(groups3.map((g) => g.members()));

      const totalMembers = totalGroups * (CHAOS_MEMBERS + 1);

      expect(members1.flat().length).toBe(totalMembers);
      expect(members2.flat().length).toBe(totalMembers);
      expect(members3.flat().length).toBe(totalMembers);

      const messages1 = await Promise.all(groups1.map((g) => g.messages()));
      const messages2 = await Promise.all(groups2.map((g) => g.messages()));
      const messages3 = await Promise.all(groups3.map((g) => g.messages()));

      const totalMessages =
        (totalMembers - totalGroups) * CHAOS_MESSAGES + CHAOS_GROUPS;

      console.log(
        `[sync] groups1: ${groups1.length}, members1: ${members1.flat().length}, messages1: ${messages1.flat().length}`,
      );
      console.log(
        `[sync] groups2: ${groups2.length}, members2: ${members2.flat().length}, messages2: ${messages2.flat().length}`,
      );
      console.log(
        `[sync] groups3: ${groups3.length}, members3: ${members3.flat().length}, messages3: ${messages3.flat().length}`,
      );

      expect(messages1.flat().length).toBe(totalMessages);
      expect(messages2.flat().length).toBe(totalMessages);
      expect(messages3.flat().length).toBe(totalMessages);
    },
  );
});
