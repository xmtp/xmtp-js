import { once } from "node:events";
import { setTimeout } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { Agent } from "@/core/Agent";
import { createSigner, createUser } from "@/user/User";

const PROXY_NAME = "node-go";
const TOXIPROXY_API = "http://localhost:8475";
const TOXIPROXY_PORT = "6010";

export async function enableBackend(enabled: boolean) {
  const res = await fetch(`${TOXIPROXY_API}/proxies/${PROXY_NAME}`, {
    method: "POST",
    body: JSON.stringify({
      name: PROXY_NAME,
      listen: `[::]:${TOXIPROXY_PORT}`,
      upstream: "node:5556",
      enabled,
    }),
  });
  if (!res.ok) throw new Error(`Failed to toggle proxy: ${await res.text()}`);
}

export async function createToxicAgent() {
  await enableBackend(true);
  return Agent.create(createSigner(createUser()), {
    env: "local",
    apiUrl: `http://localhost:${TOXIPROXY_PORT}`,
    dbPath: null,
    disableDeviceSync: true,
  });
}

describe("Agent reconnect", () => {
  it("should reconnect after a mid-stream disconnect", async () => {
    const agent = await createToxicAgent();
    await agent.start();

    const reconnected = once(agent, "start", {
      signal: AbortSignal.timeout(10000),
    });

    await enableBackend(false);
    await setTimeout(5000);
    await enableBackend(true);

    await reconnected;
    await agent.stop();
  });

  it("should reconnect when start() fails initially", async () => {
    const agent = await createToxicAgent();

    await enableBackend(false);

    const started = once(agent, "start", {
      signal: AbortSignal.timeout(10000),
    });
    void agent.start();

    await setTimeout(5000);
    await enableBackend(true);

    await started;
    await agent.stop();
  });

  it("should emit unhandledError on stream disconnect", async () => {
    const agent = await createToxicAgent();
    await agent.start();

    const errored = once(agent, "unhandledError", {
      signal: AbortSignal.timeout(10000),
    });

    await enableBackend(false);

    const [error] = (await errored) as [unknown];
    expect(error).toBeInstanceOf(Error);

    await agent.stop();
  });
});
