import { Client } from "@xmtp/node-sdk";

export async function logInstall<ContentTypes>(client: Client<ContentTypes>) {
  const myInboxId = client.inboxId;
  const myInstallationId = client.installationId;

  // Get the inbox state which includes all installations
  const inboxStates = await Client.inboxStateFromInboxIds(
    [myInboxId],
    client.options?.env,
  );
  const installations =
    inboxStates.find((state) => state.inboxId === myInboxId)?.installations ||
    [];

  // Sort installations by clientTimestampNs (higher = more recent)
  const sortedInstallations = [...installations].sort((a, b) => {
    const aTime = a.clientTimestampNs ?? 0n;
    const bTime = b.clientTimestampNs ?? 0n;
    return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
  });

  // Check if yours is the most recent
  const mostRecentInstallation = sortedInstallations[0];
  const myInstallationIdHex = Buffer.from(client.installationIdBytes).toString(
    "hex",
  );
  const mostRecentIdHex = Buffer.from(mostRecentInstallation.bytes).toString(
    "hex",
  );

  const isMostRecent = myInstallationIdHex === mostRecentIdHex;

  console.log("My Installation ID:", myInstallationId);
  console.log("Most Recent Installation ID:", mostRecentInstallation.id);
  console.log("Is my installation the most recent?", isMostRecent);
  console.log("Total installations:", installations.length);
}
