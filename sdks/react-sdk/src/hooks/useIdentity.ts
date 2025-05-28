import {
  ClientNotInitializedError,
  type Identifier,
  type SafeInstallation,
  type SafeKeyPackageStatus,
  type Signer,
} from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useClientContext } from "@/contexts/Client";

export type Installation = SafeInstallation & {
  keyPackageStatus: SafeKeyPackageStatus | undefined;
};

export const useIdentity = (syncOnMount: boolean = false) => {
  const context = useClientContext();
  const [loading, setLoading] = useState(false);
  const [inboxId, setInboxId] = useState<string | null>(null);
  const [recoveryIdentifier, setRecoveryIdentifier] =
    useState<Identifier | null>(null);
  const [identifiers, setIdentifiers] = useState<Identifier[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [error, setError] = useState<Error | null>(null);

  if (!context) {
    throw new Error("useIdentity must be used within a ClientProvider");
  }

  const { client } = context;

  useEffect(() => {
    if (syncOnMount) {
      void sync();
    }
  }, []);

  /**
   * Sync inbox state from the network
   *
   * @returns A promise that resolves when the inbox state is synced
   */
  const sync = async () => {
    if (!client) {
      setError(new ClientNotInitializedError());
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const inboxState = await client.preferences.inboxState(true);
      setInboxId(inboxState.inboxId);
      setIdentifiers(inboxState.accountIdentifiers);
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
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Revokes an installation from the inbox
   *
   * @param installationIdBytes - The installation ID (in bytes) to revoke
   * @returns A promise that resolves when the installation is revoked
   */
  const revokeInstallation = async (installationIdBytes: Uint8Array) => {
    if (!client) {
      setError(new ClientNotInitializedError());
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await client.revokeInstallations([installationIdBytes]);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Revokes all other installations from the inbox
   *
   * @returns A promise that resolves when the installations are revoked
   */
  const revokeAllOtherInstallations = async () => {
    if (!client) {
      setError(new ClientNotInitializedError());
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await client.revokeAllOtherInstallations();
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Adds a new account to the inbox
   *
   * @param signer - The signer to use to add the account
   * @param allowInboxReassign - Whether to allow inbox reassignment
   * @returns A promise that resolves when the account is added
   */
  const unsafe_addAccount = async (
    signer: Signer,
    allowInboxReassign: boolean = false,
  ) => {
    if (!client) {
      setError(new ClientNotInitializedError());
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await client.unsafe_addAccount(signer, allowInboxReassign);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Removes an account from the inbox
   *
   * @param accountIdentifier - The account identifier to remove
   * @returns A promise that resolves when the account is removed
   */
  const removeAccount = async (accountIdentifier: Identifier) => {
    if (!client) {
      setError(new ClientNotInitializedError());
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await client.removeAccount(accountIdentifier);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Changes the recovery identifier for the inbox
   *
   * @param identifier - The new recovery identifier
   * @returns A promise that resolves when the recovery identifier is changed
   */
  const changeRecoveryIdentifier = async (identifier: Identifier) => {
    if (!client) {
      setError(new ClientNotInitializedError());
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await client.changeRecoveryIdentifier(identifier);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    changeRecoveryIdentifier,
    error,
    identifiers,
    inboxId,
    installations,
    loading,
    recoveryIdentifier,
    removeAccount,
    revokeAllOtherInstallations,
    revokeInstallation,
    sync,
    unsafe_addAccount,
  };
};
