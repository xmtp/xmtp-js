import type {
  Identifier,
  SafeInstallation,
  SafeKeyPackageStatus,
} from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useClient } from "@/contexts/XMTPContext";

export type Installation = SafeInstallation & {
  keyPackageStatus: SafeKeyPackageStatus | undefined;
};

export const useIdentity = (syncOnMount: boolean = false) => {
  const client = useClient();
  const [syncing, setSyncing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [inboxId, setInboxId] = useState<string | null>(null);
  const [recoveryIdentifier, setRecoveryIdentifier] =
    useState<Identifier | null>(null);
  const [accountIdentifiers, setAccountIdentifiers] = useState<Identifier[]>(
    [],
  );
  const [installations, setInstallations] = useState<Installation[]>([]);

  useEffect(() => {
    if (syncOnMount) {
      void sync();
    }
  }, []);

  const sync = async () => {
    setSyncing(true);

    try {
      const inboxState = await client.preferences.inboxState(true);
      setInboxId(inboxState.inboxId);
      setAccountIdentifiers(inboxState.identifiers);
      setRecoveryIdentifier(inboxState.recoveryIdentifier);
      const installations = inboxState.installations.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (a.clientTimestampNs! > b.clientTimestampNs!) {
          return -1;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        } else if (a.clientTimestampNs! < b.clientTimestampNs!) {
          return 1;
        }
        return 0;
      });
      const keyPackageStatuses =
        await client.getKeyPackageStatusesForInstallationIds(
          installations.map((installation) => installation.id),
        );
      setInstallations(
        installations.map((installation) => ({
          ...installation,
          keyPackageStatus: keyPackageStatuses.get(installation.id),
        })),
      );
    } finally {
      setSyncing(false);
    }
  };

  const revokeInstallation = async (installationIdBytes: Uint8Array) => {
    setRevoking(true);

    try {
      await client.revokeInstallations([installationIdBytes]);
    } finally {
      setRevoking(false);
    }
  };

  const revokeAllOtherInstallations = async () => {
    setRevoking(true);

    try {
      await client.revokeAllOtherInstallations();
    } finally {
      setRevoking(false);
    }
  };

  return {
    accountIdentifiers,
    inboxId,
    installations,
    recoveryIdentifier,
    revokeAllOtherInstallations,
    revokeInstallation,
    revoking,
    sync,
    syncing,
  };
};
