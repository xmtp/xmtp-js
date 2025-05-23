import type {
  Client,
  ConsentEntityType,
  SafeConsent,
  StreamCallback,
  UserPreference,
} from "@xmtp/browser-sdk";
import { useCallback, useState } from "react";
import { useClient } from "@/hooks/useClient";

export const usePreferences = <ContentTypes = unknown>(
  client?: Client<ContentTypes>,
) => {
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { client: contextClient } = useClient<ContentTypes>();

  // use the passed client, or the context client
  const whichClient = client ?? contextClient;

  if (!whichClient) {
    throw new Error("XMTP client not initialized");
  }

  const sync = useCallback(async () => {
    setSyncing(true);
    const syncs = await whichClient.preferences.sync();
    setSyncing(false);
    return syncs;
  }, [whichClient]);

  const inboxState = useCallback(
    async (refreshFromNetwork?: boolean) => {
      setLoading(true);
      const inboxState =
        await whichClient.preferences.inboxState(refreshFromNetwork);
      setLoading(false);
      return inboxState;
    },
    [whichClient],
  );

  const inboxStateFromInboxIds = useCallback(
    async (inboxIds: string[], refreshFromNetwork?: boolean) => {
      setLoading(true);
      const inboxState = await whichClient.preferences.inboxStateFromInboxIds(
        inboxIds,
        refreshFromNetwork,
      );
      setLoading(false);
      return inboxState;
    },
    [whichClient],
  );

  const getLatestInboxState = useCallback(
    async (inboxId: string) => {
      setLoading(true);
      const inboxState =
        await whichClient.preferences.getLatestInboxState(inboxId);
      setLoading(false);
      return inboxState;
    },
    [whichClient],
  );

  const setConsentStates = useCallback(
    async (consentStates: SafeConsent[]) => {
      setLoading(true);
      await whichClient.preferences.setConsentStates(consentStates);
      setLoading(false);
    },
    [whichClient],
  );

  const getConsentState = useCallback(
    async (entityType: ConsentEntityType, entity: string) => {
      setLoading(true);
      const consentState = await whichClient.preferences.getConsentState(
        entityType,
        entity,
      );
      setLoading(false);
      return consentState;
    },
    [whichClient],
  );

  const streamPreferences = useCallback(
    async (callback?: StreamCallback<UserPreference[]>) =>
      whichClient.preferences.streamPreferences(callback),
    [whichClient],
  );

  const streamConsent = useCallback(
    async (callback?: StreamCallback<SafeConsent[]>) =>
      whichClient.preferences.streamConsent(callback),
    [whichClient],
  );

  return {
    sync,
    syncing,
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
