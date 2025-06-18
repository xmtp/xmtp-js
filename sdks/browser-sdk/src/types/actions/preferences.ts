import type { ConsentEntityType, ConsentState } from "@xmtp/wasm-bindings";
import type { SafeConsent, SafeInboxState } from "@/utils/conversions";

export type PreferencesAction =
  | {
      action: "preferences.inboxState";
      id: string;
      result: SafeInboxState;
      data: {
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "preferences.inboxStateFromInboxIds";
      id: string;
      result: SafeInboxState[];
      data: {
        inboxIds: string[];
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "preferences.getLatestInboxState";
      id: string;
      result: SafeInboxState;
      data: {
        inboxId: string;
      };
    }
  | {
      action: "preferences.setConsentStates";
      id: string;
      result: undefined;
      data: {
        records: SafeConsent[];
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
      result: number;
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
