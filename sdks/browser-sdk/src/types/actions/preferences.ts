import type {
  Consent,
  ConsentEntityType,
  ConsentState,
  GroupSyncSummary,
  InboxState,
} from "@xmtp/wasm-bindings";

export type PreferencesAction =
  | {
      action: "preferences.inboxState";
      id: string;
      result: InboxState;
      data: {
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "preferences.getInboxStates";
      id: string;
      result: InboxState[];
      data: {
        inboxIds: string[];
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "preferences.setConsentStates";
      id: string;
      result: undefined;
      data: {
        records: Consent[];
      };
    }
  | {
      action: "preferences.getConsentState";
      id: string;
      result: ConsentState;
      data: {
        entityType: ConsentEntityType;
        entity: string;
      };
    }
  | {
      action: "preferences.sync";
      id: string;
      result: GroupSyncSummary;
      data: undefined;
    }
  | {
      action: "preferences.streamConsent";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    }
  | {
      action: "preferences.streamPreferences";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    };
