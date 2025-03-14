import type { Identifier, SafeInstallation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useXMTP } from "@/contexts/XMTPContext";

export const useIdentity = (syncOnMount: boolean = false) => {
  const { client } = useXMTP();
  const [syncing, setSyncing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [inboxId, setInboxId] = useState<string | null>(null);
  const [recoveryIdentifier, setRecoveryIdentifier] =
    useState<Identifier | null>(null);
  const [accountIdentifiers, setAccountIdentifiers] = useState<Identifier[]>(
    [],
  );
  const [installations, setInstallations] = useState<SafeInstallation[]>([]);

  useEffect(() => {
    if (syncOnMount) {
      void sync();
    }
  }, []);

  const sync = async () => {
    if (!client) {
      return;
    }

    setSyncing(true);

    try {
      const inboxState = await client.inboxState(true);
      setInboxId(inboxState.inboxId);
      setAccountIdentifiers(inboxState.accountIdentifiers);
      setRecoveryIdentifier(inboxState.recoveryIdentifier);
      const installations = inboxState.installations.filter(
        (installation) => installation.id !== client.installationId,
      );
      setInstallations(installations);
    } finally {
      setSyncing(false);
    }
  };

  const revokeInstallation = async (installationIdBytes: Uint8Array) => {
    if (!client) {
      return;
    }

    setRevoking(true);

    try {
      await client.revokeInstallations([installationIdBytes]);
    } finally {
      setRevoking(false);
    }
  };

  const revokeAllOtherInstallations = async () => {
    if (!client) {
      return;
    }

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
