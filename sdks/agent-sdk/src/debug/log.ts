import { Client, LogLevel } from "@xmtp/node-sdk";
import type { Agent } from "@/core/Agent";

const validLogLevels: LogLevel[] = [
  LogLevel.Off,
  LogLevel.Error,
  LogLevel.Warn,
  LogLevel.Info,
  LogLevel.Debug,
  LogLevel.Trace,
];

const isLogLevel = (level: string): level is LogLevel => {
  return validLogLevels.includes(level as LogLevel);
};

export const getValidLogLevels = (): LogLevel[] => {
  return [...validLogLevels];
};

export const parseLogLevel = (rawLevel: string) => {
  const normalizedLevel =
    rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase();

  if (isLogLevel(normalizedLevel)) {
    return normalizedLevel;
  }

  return null;
};

export const logDetails = async <ContentTypes>(agent: Agent<ContentTypes>) => {
  const xmtp = `\x1b[38;2;252;76;52m
    ██╗  ██╗███╗   ███╗████████╗██████╗
    ╚██╗██╔╝████╗ ████║╚══██╔══╝██╔══██╗
     ╚███╔╝ ██╔████╔██║   ██║   ██████╔╝
     ██╔██╗ ██║╚██╔╝██║   ██║   ██╔═══╝
    ██╔╝ ██╗██║ ╚═╝ ██║   ██║   ██║
    ╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝   ╚═╝
  \x1b[0m`;

  const client = agent.client;
  const clientsByAddress = client.accountIdentifier?.identifier;
  const inboxId = client.inboxId;
  const installationId = client.installationId;
  const env = client.options?.env;

  const urls = [`http://xmtp.chat/${env}/dm/${clientsByAddress}`];

  const conversations = await client.conversations.list();
  const inboxState = await client.preferences.inboxState();
  const keyPackageStatuses = await client.fetchKeyPackageStatuses([
    installationId,
  ]);

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
    • LibXMTP Version: ${agent.libxmtpVersion}
    • Address: ${clientsByAddress}
    • Conversations: ${conversations.length}
    • Installations: ${inboxState.installations.length}
    • InstallationId: ${installationId}
    • Key Package created: ${createdDate.toLocaleString()}
    • Key Package valid until: ${expiryDate.toLocaleString()}
    • Networks: ${env}
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
  const env = client.options?.env;
  return `http://xmtp.chat/${env}/dm/${address}`;
};

type InstallationInfo = {
  totalInstallations: number;
  installationId: string;
  mostRecentInstallationId: null | string;
  isMostRecent: boolean;
};

export const getInstallationInfo = async <ContentTypes>(
  client: Client<ContentTypes>,
): Promise<InstallationInfo> => {
  const myInboxId = client.inboxId;
  const myInstallationId = client.installationId;

  const env = client.options?.env;
  const gatewayHost =
    client.options && "gatewayHost" in client.options
      ? client.options.gatewayHost
      : undefined;
  const inboxStates = await Client.fetchInboxStates(
    [myInboxId],
    env,
    gatewayHost,
  );

  const installations =
    inboxStates.find((state) => state.inboxId === myInboxId)?.installations ||
    [];

  const sortedInstallations = [...installations].sort((a, b) => {
    const aTime = a.clientTimestampNs ?? 0n;
    const bTime = b.clientTimestampNs ?? 0n;
    return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
  });

  const mostRecentInstallation = sortedInstallations[0];

  const myInstallationIdHex = Buffer.from(client.installationIdBytes).toString(
    "hex",
  );

  const info: InstallationInfo = {
    totalInstallations: installations.length,
    installationId: myInstallationId,
    mostRecentInstallationId: null,
    isMostRecent: false,
  };

  if (mostRecentInstallation) {
    const mostRecentIdHex = Buffer.from(mostRecentInstallation.bytes).toString(
      "hex",
    );
    info.mostRecentInstallationId = mostRecentIdHex;
    info.isMostRecent = myInstallationIdHex === mostRecentIdHex;
  }

  return info;
};
