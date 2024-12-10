import type { SafeInstallation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { ClientNotFoundError } from "../helpers/errors";
import { useClient } from "./useClient";

export const useIdentity = (syncOnMount: boolean = false) => {
  const { client } = useClient();
  const [syncing, setSyncing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [inboxId, setInboxId] = useState<string | null>(null);
  const [recoveryAddress, setRecoveryAddress] = useState<string | null>(null);
  const [accountAddresses, setAccountAddresses] = useState<string[]>([]);
  const [installations, setInstallations] = useState<SafeInstallation[]>([]);

  useEffect(() => {
    if (syncOnMount) {
      void sync();
    }
  }, []);

  const sync = async () => {
    if (!client) {
      throw new ClientNotFoundError("syncing");
    }

    setSyncing(true);

    try {
      const inboxState = await client.inboxState(true);
      setInboxId(inboxState.inboxId);
      setAccountAddresses(inboxState.accountAddresses);
      setRecoveryAddress(inboxState.recoveryAddress);
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
      throw new ClientNotFoundError("revoking an installation");
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
      throw new ClientNotFoundError("revoking all other installations");
    }

    setRevoking(true);

    try {
      await client.revokeAllOtherInstallations();
    } finally {
      setRevoking(false);
    }
  };

  return {
    accountAddresses,
    inboxId,
    installations,
    recoveryAddress,
    revokeAllOtherInstallations,
    revokeInstallation,
    revoking,
    sync,
    syncing,
  };
};
