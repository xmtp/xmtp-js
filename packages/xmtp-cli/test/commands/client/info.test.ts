import { describe, expect, it } from "vitest";
import {
  createTestIdentity,
  parseJsonOutput,
  runWithIdentity,
} from "../../helpers.js";

interface ClientInfoOutput {
  properties: {
    address: string;
    inboxId: string;
    installationId: string;
    isRegistered: boolean;
    appVersion: string;
    libxmtpVersion: string;
  };
  options: {
    env: string;
    apiUrl?: string;
    historySyncUrl?: string;
    gatewayHost?: string;
    dbPath: string;
    loggingLevel?: string;
    structuredLogging?: boolean;
    disableAutoRegister?: boolean;
    disableDeviceSync?: boolean;
    appVersion?: string;
    nonce?: string;
  };
}

describe("client info", () => {
  it("returns client info with JSON output", async () => {
    const identity = createTestIdentity();
    const result = await runWithIdentity(identity, [
      "client",
      "info",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const info = parseJsonOutput<ClientInfoOutput>(result.stdout);
    expect(info.properties.address).toMatch(/^0x[a-f0-9]{40}$/i);
    expect(info.properties.inboxId).toBeDefined();
    expect(info.properties.installationId).toBeDefined();
    expect(info.properties.isRegistered).toBe(true);
    expect(info.properties.libxmtpVersion).toBeDefined();
    expect(info.properties.appVersion).toBeDefined();
    expect(info.options.appVersion).toMatch(/^xmtp-cli\/\d+\.\d+\.\d+/);
    expect(info.options.env).toBe("local");
    expect(info.options.dbPath).toBeDefined();
  });

  it("returns consistent inboxId for same wallet", async () => {
    const identity = createTestIdentity();

    const result1 = await runWithIdentity(identity, [
      "client",
      "info",
      "--json",
    ]);
    const result2 = await runWithIdentity(identity, [
      "client",
      "info",
      "--json",
    ]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    const info1 = parseJsonOutput<ClientInfoOutput>(result1.stdout);
    const info2 = parseJsonOutput<ClientInfoOutput>(result2.stdout);

    expect(info1.properties.inboxId).toBe(info2.properties.inboxId);
    expect(info1.properties.address).toBe(info2.properties.address);
  });

  it("returns different inboxId for different wallets", async () => {
    const identity1 = createTestIdentity();
    const identity2 = createTestIdentity();

    const result1 = await runWithIdentity(identity1, [
      "client",
      "info",
      "--json",
    ]);
    const result2 = await runWithIdentity(identity2, [
      "client",
      "info",
      "--json",
    ]);

    expect(result1.exitCode).toBe(0);
    expect(result2.exitCode).toBe(0);

    const info1 = parseJsonOutput<ClientInfoOutput>(result1.stdout);
    const info2 = parseJsonOutput<ClientInfoOutput>(result2.stdout);

    expect(info1.properties.inboxId).not.toBe(info2.properties.inboxId);
    expect(info1.properties.address).not.toBe(info2.properties.address);
  });

  it("outputs table format by default", async () => {
    const identity = createTestIdentity();
    const result = await runWithIdentity(identity, ["client", "info"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Client");
    expect(result.stdout).toContain("address");
    expect(result.stdout).toContain("inboxId");
    expect(result.stdout).toContain("Options");
    expect(result.stdout).toContain("env");
  });

  it("fails without wallet key", async () => {
    const identity = createTestIdentity();
    const result = await runWithIdentity({ ...identity, walletKey: "" }, [
      "client",
      "info",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
