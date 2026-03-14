import { once } from "node:events";
import { setTimeout } from "node:timers/promises";
import { createToxicAgent, enableBackend } from "@/core/Agent.reconnect.test";

console.log("Scenario: Streams break while agent is running");
const agent = await createToxicAgent();
agent.errors.use((error, _ctx, next) => {
  console.error("Error occurred", error);
  void next();
});

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
