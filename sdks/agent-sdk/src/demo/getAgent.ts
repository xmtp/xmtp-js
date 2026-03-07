import { loadEnvFile } from "node:process";
import { Agent } from "@/core/index";
import { createSigner, createUser } from "@/user/User";

try {
  loadEnvFile();
  console.info(`Loaded keys from ".env" file.`);
} catch {}

export function getAgent() {
  if (process.env.XMTP_WALLET_KEY) {
    return Agent.createFromEnv();
  }
  return Agent.create(createSigner(createUser()), { dbPath: null });
}
