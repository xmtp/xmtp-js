import type {
  ConsentEntityType,
  SafeConsent,
  StreamCallback,
  UserPreference,
} from "@xmtp/browser-sdk";
import { useCallback, useState } from "react";
import { useClient } from "@/hooks/useClient";

export const usePreferences = () => {
  const [loading, setLoading] = useState(false);
  const { client } = useClient();

  if (!client) {
    throw new Error("XMTP client not initialized");
  }

  const sync = useCallback(async () => {
    setLoading(true);
    const syncs = await client.preferences.sync();
    setLoading(false);
    return syncs;
  }, [client]);

  const inboxState = useCallback(
    async (refreshFromNetwork?: boolean) => {
      setLoading(true);
      const inboxState =
        await client.preferences.inboxState(refreshFromNetwork);
      setLoading(false);
      return inboxState;
    },
    [client],
  );

  const inboxStateFromInboxIds = useCallback(
    async (inboxIds: string[], refreshFromNetwork?: boolean) => {
      setLoading(true);
      const inboxState = await client.preferences.inboxStateFromInboxIds(
        inboxIds,
        refreshFromNetwork,
      );
      setLoading(false);
      return inboxState;
    },
    [client],
  );

  const getLatestInboxState = useCallback(
    async (inboxId: string) => {
      setLoading(true);
      const inboxState = await client.preferences.getLatestInboxState(inboxId);
      setLoading(false);
      return inboxState;
    },
    [client],
  );

  const setConsentStates = useCallback(
    async (consentStates: SafeConsent[]) => {
      setLoading(true);
      await client.preferences.setConsentStates(consentStates);
      setLoading(false);
    },
    [client],
  );

  const getConsentState = useCallback(
    async (entityType: ConsentEntityType, entity: string) => {
      setLoading(true);
      const consentState = await client.preferences.getConsentState(
        entityType,
        entity,
      );
      setLoading(false);
      return consentState;
    },
    [client],
  );

  const streamPreferences = useCallback(
    async (callback?: StreamCallback<UserPreference[]>) =>
      client.preferences.streamPreferences(callback),
    [client],
  );

  const streamConsent = useCallback(
    async (callback?: StreamCallback<SafeConsent[]>) =>
      client.preferences.streamConsent(callback),
    [client],
  );

  return {
    sync,
    loading,
    inboxState,
    inboxStateFromInboxIds,
    getLatestInboxState,
    setConsentStates,
    getConsentState,
    streamPreferences,
    streamConsent,
  };
};
