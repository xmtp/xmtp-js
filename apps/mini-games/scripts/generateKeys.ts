import { getRandomValues } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { uint8ArrayToHex } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";

const generateEncryptionKeyHex = () => {
  const uint8Array = getRandomValues(new Uint8Array(32));
  return uint8ArrayToHex(uint8Array);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check Node.js version
const nodeVersion = process.versions.node;
const [major] = nodeVersion.split(".").map(Number);
if (major < 20) {
  console.error("Error: Node.js version 20 or higher is required");
  process.exit(1);
}

console.log("Generating keys for mini games app...");

const walletKey = generatePrivateKey();
const encryptionKeyHex = generateEncryptionKeyHex();

const filePath = join(__dirname, "..", ".env");
console.log(`Creating .env file in: ${__dirname}`);

const envContent = `# XMTP keys for mini games app
WALLET_KEY=${walletKey}
ENCRYPTION_KEY=${encryptionKeyHex}
XMTP_ENV=dev
`;

// Write the .env file to the example directory
await writeFile(filePath, envContent);
console.log(`Keys written to ${filePath}`);
