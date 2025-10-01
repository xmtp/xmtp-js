import { Client } from "@xmtp/node-sdk";

export const logDetails = async <ContentTypes>(
  client: Client<ContentTypes>,
) => {
  const xmtp = `\x1b[38;2;252;76;52m
    ██╗  ██╗███╗   ███╗████████╗██████╗ 
    ╚██╗██╔╝████╗ ████║╚══██╔══╝██╔══██╗
     ╚███╔╝ ██╔████╔██║   ██║   ██████╔╝
     ██╔██╗ ██║╚██╔╝██║   ██║   ██╔═══╝ 
    ██╔╝ ██╗██║ ╚═╝ ██║   ██║   ██║     
    ╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝   ╚═╝     
  \x1b[0m`;

  const clientsByAddress = client.accountIdentifier?.identifier;
  const inboxId = client.inboxId;
  const installationId = client.installationId;
  const environments = client.options?.env ?? "dev";

  const urls = [`http://xmtp.chat/dm/${clientsByAddress}`];

  const conversations = await client.conversations.list();
  const inboxState = await client.preferences.inboxState();
  const keyPackageStatuses =
    await client.getKeyPackageStatusesForInstallationIds([installationId]);

  let createdDate = new Date();
  let expiryDate = new Date();

  // Extract key package status for the specific installation
  const keyPackageStatus = keyPackageStatuses[installationId] ?? {};
  if (keyPackageStatus.lifetime) {
    createdDate = new Date(Number(keyPackageStatus.lifetime.notBefore) * 1000);
    expiryDate = new Date(Number(keyPackageStatus.lifetime.notAfter) * 1000);
  }
  console.log(`
    ${xmtp}
    
    ✓ XMTP Client:
    • InboxId: ${inboxId}
    • Version: ${Client.version}
    • Address: ${clientsByAddress}
    • Conversations: ${conversations.length}
    • Installations: ${inboxState.installations.length}
    • InstallationId: ${installationId}
    • Key Package created: ${createdDate.toLocaleString()}
    • Key Package valid until: ${expiryDate.toLocaleString()}
    • Networks: ${environments}
    ${urls.map((url) => `• URL: ${url}`).join("\n")}`);
};

/**
 * Returns a URL to test your agent on https://xmtp.chat/ (for development purposes only).
 *
 * @param client - Your XMTP client
 * @returns The URL to test your agent with
 */
export const getTestUrl = <ContentTypes>(client: Client<ContentTypes>) => {
  const address = client.accountIdentifier?.identifier;
  const env = client.options?.env ?? "dev";
  return `http://xmtp.chat/dm/${address}?env=${env}`;
};
