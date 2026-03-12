import { once } from "node:events";
import { setTimeout } from "node:timers/promises";
import { Agent } from "@/core/index";
import { createSigner, createUser } from "@/user/User";

const PROXY_NAME = "node-go";
const TOXIPROXY_API = "http://localhost:8475";
const TOXIPROXY_PORT = "6010";

/** Turn the proxy server to the backend on or off. */
async function enableBackend(isEnabled: boolean) {
  console.log(`Turning backend ${isEnabled ? "on" : "off"}...`);
  const res = await fetch(`${TOXIPROXY_API}/proxies/${PROXY_NAME}`, {
    method: "POST",
    body: JSON.stringify({
      name: PROXY_NAME,
      listen: `[::]:${TOXIPROXY_PORT}`,
      upstream: "node:5556",
      enabled: isEnabled,
    }),
  });
  if (!res.ok) throw new Error(`Failed to toggle backend: ${await res.text()}`);
}

async function createToxicAgent() {
  await enableBackend(true);
  const agent = await Agent.create(createSigner(createUser()), {
    env: "local",
    apiUrl: `http://localhost:${TOXIPROXY_PORT}`,
    dbPath: null,
    disableDeviceSync: true,
  });

  agent.errors.use((error, _ctx, next) => {
    console.error("Error occured", error);
    void next();
  });

  return agent;
}

console.log("Scenario: Streams break while agent is running");
const agent = await createToxicAgent();

await agent.start();
console.log("Agent started");
await setTimeout(2000);

// Set up a promise that resolves on the next "start" event (= reconnect)
const reconnected = once(agent, "start");

await enableBackend(false);
await setTimeout(5000);
await enableBackend(true);

await reconnected;
console.log("Agent reconnected");

await agent.stop();
process.exit(0);
