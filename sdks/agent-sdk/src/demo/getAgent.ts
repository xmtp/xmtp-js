import { loadEnvFile } from "node:process";
import { Agent } from "@/core/index";
import { getTestUrl } from "@/debug/log";
import { createSigner, createUser } from "@/user/User";

try {
  loadEnvFile();
  console.info(`Loaded keys from ".env" file.`);
} catch {}

export async function getAgent() {
  const agent = process.env.XMTP_WALLET_KEY
    ? await Agent.createFromEnv()
    : await Agent.create(createSigner(createUser()), { dbPath: null });

  agent.on("start", (ctx) => {
    console.log(`Address: ${agent.address}`);
    console.log(`Link: ${getTestUrl(ctx.client)}`);
    console.log("Agent started. Waiting for messages...");
  });

  return agent;
}
