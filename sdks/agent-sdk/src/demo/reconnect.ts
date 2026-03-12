import { Agent } from "@/core/index";
import { createSigner, createUser } from "@/user/User";

const TOXIPROXY_API = "http://localhost:8475";
const TOXIPROXY_GRPC = "http://localhost:6010";
const PROXY_NAME = "node-go";

async function setProxyEnabled(enabled: boolean) {
  const res = await fetch(`${TOXIPROXY_API}/proxies/${PROXY_NAME}`, {
    method: "POST",
    body: JSON.stringify({
      name: PROXY_NAME,
      listen: "[::]:6010",
      upstream: "node:5556",
      enabled,
    }),
  });
  if (!res.ok)
    throw new Error(`Failed to toggle proxy: ${await res.text()}`);
  console.log(
    `[toxiproxy] Proxy "${PROXY_NAME}" ${enabled ? "enabled" : "disabled"}`,
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ────────────────────────────────────────────────────────
// Scenario 1: Mid-stream disconnect
//   Agent is running, proxy is disabled, streams break.
// ────────────────────────────────────────────────────────
async function scenarioMidStreamDisconnect() {
  console.log("=== Scenario 1: Mid-stream disconnect ===\n");

  // Ensure proxy is enabled for client creation
  await setProxyEnabled(true);

  const agent = await Agent.create(createSigner(createUser()), {
    env: "local",
    apiUrl: TOXIPROXY_GRPC,
    dbPath: null,
    disableDeviceSync: true,
  });

  let startCount = 0;
  const errors: string[] = [];

  agent.errors.use((error, _ctx, next) => {
    const msg =
      error instanceof Error ? error.message : String(error);
    errors.push(msg);
    console.log(`  [error handler] ${msg} → signaling recovery`);
    next();
  });

  agent.on("start", () => {
    startCount++;
    console.log(`  [agent] Start event (count: ${startCount})`);
  });

  agent.on("stop", () => {
    console.log(`  [agent] Stop event`);
  });

  console.log("  Starting agent...");
  await agent.start();
  await sleep(2000);

  console.log("  Disabling proxy...");
  await setProxyEnabled(false);
  await sleep(10000);

  console.log("  Re-enabling proxy...");
  await setProxyEnabled(true);
  await sleep(5000);

  console.log(`\n  Result: started ${startCount}x, errors: ${errors.length}`);
  if (startCount >= 2) {
    console.log("  PASS: Agent reconnected after mid-stream disconnect.\n");
  } else {
    console.log(
      "  FINDING: Agent did NOT reconnect. The onError callback signals\n" +
        "  recovery but does not call #handleStreamError, so no restart occurs.\n" +
        "  Only the outer catch in start() triggers #handleStreamError.\n",
    );
  }

  await agent.stop();
}

// ────────────────────────────────────────────────────────
// Scenario 2: start() fails, then succeeds on retry
//   Proxy is disabled before start(), so initial stream
//   creation fails → #handleStreamError → auto-restart.
// ────────────────────────────────────────────────────────
async function scenarioStartFailure() {
  console.log("=== Scenario 2: start() fails, then backend recovers ===\n");

  // Create client while proxy is still up
  await setProxyEnabled(true);

  const agent = await Agent.create(createSigner(createUser()), {
    env: "local",
    apiUrl: TOXIPROXY_GRPC,
    dbPath: null,
    disableDeviceSync: true,
  });

  let startCount = 0;
  const errors: string[] = [];

  agent.errors.use((error, _ctx, next) => {
    const msg =
      error instanceof Error ? error.message : String(error);
    errors.push(msg);
    console.log(`  [error handler] ${msg} → signaling recovery`);
    next();
  });

  agent.on("start", () => {
    startCount++;
    console.log(`  [agent] Start event (count: ${startCount})`);
  });

  // Disable proxy before start()
  console.log("  Disabling proxy before start()...");
  await setProxyEnabled(false);
  await sleep(1000);

  // start() should fail on stream creation, triggering #handleStreamError
  console.log("  Calling agent.start() (expecting failure)...");
  // Don't await — start() will internally retry via queueMicrotask
  agent.start();

  // Let it fail a couple of times
  console.log("  Waiting 10s for retry attempts...");
  await sleep(10000);

  // Re-enable proxy so the next retry succeeds
  console.log("  Re-enabling proxy...");
  await setProxyEnabled(true);

  // Wait for successful reconnect
  console.log("  Waiting 10s for successful start...");
  await sleep(10000);

  console.log(`\n  Result: started ${startCount}x, errors: ${errors.length}`);
  if (startCount >= 1) {
    console.log("  PASS: Agent started after initial failures.\n");
  } else {
    console.log("  FAIL: Agent never started.\n");
  }

  await agent.stop();
}

async function main() {
  console.log("--- Agent Reconnect Demo (via Toxiproxy) ---\n");

  // Verify toxiproxy is reachable
  const proxyRes = await fetch(`${TOXIPROXY_API}/proxies/${PROXY_NAME}`);
  if (!proxyRes.ok) {
    console.error(
      `Toxiproxy proxy "${PROXY_NAME}" not found. Is the dev stack running?`,
    );
    process.exit(1);
  }
  console.log(`[toxiproxy] Proxy "${PROXY_NAME}" is available.\n`);

  await scenarioMidStreamDisconnect();
  await scenarioStartFailure();

  console.log("--- Done ---");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
