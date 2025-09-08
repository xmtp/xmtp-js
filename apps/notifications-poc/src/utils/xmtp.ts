import {
  IdentifierKind,
  Client as XmtpClient,
  type Signer as XmtpSigner,
} from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

if (!process.env.XMTP_DB_ENCRYPTION_BASE_64_KEY) {
  throw new Error("Missing XMTP_DB_ENCRYPTION_BASE_64_KEY");
}

// Generate random bytes for encryption key if none provided
const encryptionKey = Buffer.from(
  process.env.XMTP_DB_ENCRYPTION_BASE_64_KEY,
  "base64",
);

// Cache the XMTP client to avoid creating multiple instances
let cachedXmtpClientCreationPromise: Promise<XmtpClient> | undefined =
  undefined;

export const currentXmtpEnv = process.env.XMTP_ENV as
  | "local"
  | "dev"
  | "production";

/**
 * Get a cached XMTP client instance for server-wide operations
 * This client is reused across requests and uses a persistent encryption key
 */
export async function getXmtpClient(): Promise<XmtpClient> {
  if (cachedXmtpClientCreationPromise) {
    return cachedXmtpClientCreationPromise;
  }

  const signer = createSigner();
  cachedXmtpClientCreationPromise = XmtpClient.create(signer, {
    dbEncryptionKey: encryptionKey,
    env: currentXmtpEnv,
  });

  return cachedXmtpClientCreationPromise;
}

/**
 * Get all Ethereum addresses associated with an XMTP inbox ID
 * This is used to verify ownership of on-chain names
 */
export async function getAddressesForInboxId(
  inboxId: string,
): Promise<string[]> {
  try {
    const client = await getXmtpClient();
    const { identifiers } =
      await client.preferences.getLatestInboxState(inboxId);
    return identifiers
      .filter(
        (identifier) => identifier.identifierKind == IdentifierKind.Ethereum,
      )
      .map((identifier) => identifier.identifier);
  } catch (error) {
    console.error("Error getting addresses for inbox:", error);
    return [];
  }
}

function createSigner(): XmtpSigner {
  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address,
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({ message });
      return toBytes(signature);
    },
  };
}
