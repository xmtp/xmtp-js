import { keystore as keystoreProto } from "@xmtp/proto";
import JobRunner from "@/conversations/JobRunner";
import { PrivateKeyBundleV1 } from "@/crypto/PrivateKeyBundle";
import InMemoryKeystore from "@/keystore/InMemoryKeystore";
import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import type { KeystoreInterface } from "@/keystore/rpcDefinitions";
import { nsToDate } from "@/utils/date";
import { newWallet, sleep } from "@test/helpers";

describe("JobRunner", () => {
  let keystore: KeystoreInterface;

  beforeEach(async () => {
    const bundle = await PrivateKeyBundleV1.generate(newWallet());
    keystore = await InMemoryKeystore.create(
      bundle,
      InMemoryPersistence.create(),
    );
  });

  it("can set the job time correctly", async () => {
    const v1Runner = new JobRunner("v1", keystore);
    await v1Runner.run(async (lastRun) => {
      expect(lastRun).toBeUndefined();
    });

    const { lastRunNs } = await keystore.getRefreshJob({
      jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_V1,
    });

    // We don't know the exact timestamp that the runner will set from outside, so just assume it was within a second of now
    expect(new Date().getTime() - nsToDate(lastRunNs).getTime()).toBeLessThan(
      1000,
    );
  });

  it("sets different values for v1 and v2 runners", async () => {
    const v1Runner = new JobRunner("v1", keystore);
    const v2Runner = new JobRunner("v2", keystore);

    await v1Runner.run(async () => {});
    // Ensure they have different timestamps
    await sleep(10);
    await v2Runner.run(async () => {});

    const { lastRunNs: v1LastRunNs } = await keystore.getRefreshJob({
      jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_V1,
    });
    const { lastRunNs: v2LastRunNs } = await keystore.getRefreshJob({
      jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_V2,
    });

    expect(v1LastRunNs.gt(0)).toBeTruthy();
    expect(v2LastRunNs.gt(0)).toBeTruthy();
    expect(v1LastRunNs.eq(v2LastRunNs)).toBe(false);
  });

  it("fails with an invalid job type", async () => {
    // @ts-expect-error test case
    const v3Runner = new JobRunner("v3", keystore);
    expect(v3Runner.run(async () => {})).rejects.toThrow(
      "unknown job type: v3",
    );
  });

  it("returns the value from the callback", async () => {
    const v1Runner = new JobRunner("v1", keystore);

    const result = await v1Runner.run(async () => {
      return "foo";
    });
    expect(result).toBe("foo");
  });

  it("bubbles up errors from the callback", async () => {
    const v1Runner = new JobRunner("v1", keystore);

    await expect(
      v1Runner.run(async () => {
        throw new Error("foo");
      }),
    ).rejects.toThrow("foo");
  });

  it("resets the last run time", async () => {
    const userPreferencesRunner = new JobRunner("user-preferences", keystore);
    await userPreferencesRunner.run(async () => {});

    const { lastRunNs: userPreferencesLastRunNs } =
      await keystore.getRefreshJob({
        jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_PPPP,
      });

    expect(userPreferencesLastRunNs.gt(0)).toBeTruthy();

    await userPreferencesRunner.resetLastRunTime();

    const { lastRunNs: userPreferencesLastRunNs2 } =
      await keystore.getRefreshJob({
        jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_PPPP,
      });

    expect(userPreferencesLastRunNs2.eq(0)).toBeTruthy();
  });
});
