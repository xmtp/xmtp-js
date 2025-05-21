import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import type { Client } from "@/Client";
import type { Group } from "@/Group";
import type { Signer } from "@/utils/signer";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

const CHAOS_GROUPS = 10;
const CHAOS_MESSAGES = 10;
const CHAOS_MEMBERS = 5;
const CHAOS_INSTALLATIONS = 3;
const TOTAL_GROUPS = CHAOS_GROUPS * CHAOS_INSTALLATIONS;
const TOTAL_MEMBERS = TOTAL_GROUPS * (CHAOS_MEMBERS + 1);
const TOTAL_MESSAGES =
  (TOTAL_MEMBERS - TOTAL_GROUPS) * CHAOS_MESSAGES + CHAOS_GROUPS;

const MAX_SLEEP = 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomSleep = () => sleep(Math.floor(Math.random() * MAX_SLEEP));

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
  const testClients = await createRegisteredTestClients(numTestClients);
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
      await randomSleep();
      groups.push(group);
      // sync all test clients
      await Promise.all(testClientsToAdd.map((c) => c.conversations.sync()));
      // get conversation on all test clients
      const testGroups = await Promise.all(
        testClientsToAdd.map((c) =>
          c.conversations.getConversationById(group.id),
        ),
      );
      await Promise.all(
        testGroups.map(async (testGroup) => {
          // get the conversation on the test client
          if (!testGroup) {
            console.log(`[chaos] test group ${group.id} not found`);
            return Promise.resolve();
          }
          await Promise.all(
            Array.from({ length: numMessages }).map(async () => {
              await testGroup.send("gm");
              await randomSleep();
            }),
          );
        }),
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
      syncs.push(sync);
    });
  }, interval);
  return async () => {
    // clear the interval
    clearInterval(intervalId);
    // sync one last time
    const sync = await client.conversations.syncAll();
    // return the syncs
    return sync;
  };
};

const createInstallationChaos = async (signer: Signer) => {
  // create the installation
  const installation = await createRegisteredClient(signer, {
    dbPath: `./test-${v4()}.db3`,
  });
  // start syncing the installation
  const stopSync = clientSyncAll(installation);
  // create some chaos
  const chaos = createChaos(installation, 100, CHAOS_GROUPS, CHAOS_MESSAGES);
  // return the installation and chaos
  return { installation, chaos, stopSync };
};

const startInstallationChaos = async (
  signer: Signer,
  numInstallations: number,
) => {
  const installations = [];
  const stopSyncs: (() => Promise<bigint>)[] = [];
  const chaosResults: Promise<Group<string | GroupUpdated>[]>[] = [];
  for (let i = 0; i < numInstallations; i++) {
    const { installation, chaos, stopSync } =
      await createInstallationChaos(signer);
    installations.push(installation);
    stopSyncs.push(stopSync);
    chaosResults.push(chaos);
  }
  const stopSync = async () => Promise.all(stopSyncs.map((s) => s()));
  const chaosGroups = async () => Promise.all(chaosResults);
  return { installations, stopSync, chaosGroups };
};

describe("E2E: Installation syncing", () => {
  it(
    "should sync groups and messages across multiple installations",
    {
      timeout: 300000,
    },
    async () => {
      const user = createUser();
      const signer = createSigner(user);
      const { installations, stopSync, chaosGroups } =
        await startInstallationChaos(signer, CHAOS_INSTALLATIONS);

      // wait for the chaos to end, get the created groups
      const groups = await chaosGroups();
      expect(groups.flat().length).toBe(TOTAL_GROUPS);

      // stop the installation syncs, get the number of synced items
      const syncs = await stopSync();

      // verify sync counts
      let extraCount = CHAOS_INSTALLATIONS;
      syncs.forEach((sync, idx) => {
        expect(Number(sync)).toBe(TOTAL_GROUPS + extraCount);
        extraCount--;
        console.log(
          `[sync] total syncs for installation ${installations[idx].installationId}: ${sync}`,
        );
      });

      await Promise.all(
        installations.map(async (installation) => {
          const groups = await installation.conversations.list();
          expect(groups.length).toBe(TOTAL_GROUPS);

          const members = await Promise.all(groups.map((g) => g.members()));
          expect(members.flat().length).toBe(TOTAL_MEMBERS);

          const messages = await Promise.all(groups.map((g) => g.messages()));
          expect(messages.flat().length).toBe(TOTAL_MESSAGES);

          console.log(
            `[sync] installation ${installation.installationId} groups: ${groups.length}, members: ${members.flat().length}, messages: ${messages.flat().length}`,
          );
        }),
      );
    },
  );
});
