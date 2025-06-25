import { describe, expect, it } from "vitest";
import {
  createRegisteredClient,
  createSigner,
  createUser,
} from "@test/helpers";

describe("DebugInformation", () => {
  it("should return network API statistics", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);

    const apiStats = client.debugInformation.apiStatistics();
    expect(apiStats.fetchKeyPackage).toBe(0n);
    expect(apiStats.queryGroupMessages).toBe(0n);
    expect(apiStats.queryWelcomeMessages).toBe(0n);
    expect(apiStats.sendGroupMessages).toBe(0n);
    expect(apiStats.sendWelcomeMessages).toBe(0n);
    expect(apiStats.subscribeMessages).toBe(0n);
    expect(apiStats.subscribeWelcomes).toBe(0n);
    expect(apiStats.uploadKeyPackage).toBe(1n);

    const apiIdentityStats = client.debugInformation.apiIdentityStatistics();
    expect(apiIdentityStats.getIdentityUpdatesV2).toBe(2n);
    expect(apiIdentityStats.getInboxIds).toBe(1n);
    expect(apiIdentityStats.publishIdentityUpdate).toBe(1n);
    expect(apiIdentityStats.verifySmartContractWalletSignature).toBe(0n);

    client.debugInformation.clearAllStatistics();

    const apiStats2 = client.debugInformation.apiStatistics();
    expect(apiStats2.uploadKeyPackage).toBe(0n);
    expect(apiStats2.fetchKeyPackage).toBe(0n);
    expect(apiStats2.sendGroupMessages).toBe(0n);
    expect(apiStats2.sendWelcomeMessages).toBe(0n);
    expect(apiStats2.queryGroupMessages).toBe(0n);
    expect(apiStats2.queryWelcomeMessages).toBe(0n);
    expect(apiStats2.subscribeMessages).toBe(0n);

    const apiIdentityStats2 = client.debugInformation.apiIdentityStatistics();
    expect(apiIdentityStats2.getIdentityUpdatesV2).toBe(0n);
    expect(apiIdentityStats2.getInboxIds).toBe(0n);
    expect(apiIdentityStats2.publishIdentityUpdate).toBe(0n);
    expect(apiIdentityStats2.verifySmartContractWalletSignature).toBe(0n);

    const apiAggregateStats = client.debugInformation.apiAggregateStatistics();
    expect(apiAggregateStats).toBeDefined();
  });

  it("should upload a debug archive", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);

    const result = await client.debugInformation.uploadDebugArchive();
    expect(result).toBeDefined();
  });
});
