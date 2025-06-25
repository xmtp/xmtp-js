import type { Identifier } from "@xmtp/wasm-bindings";
import type { XmtpEnv } from "@/types/options";
import type { SafeInboxState } from "@/utils/conversions";
import type { SafeSigner } from "@/utils/signer";

export type UtilsWorkerAction =
  | {
      action: "utils.init";
      id: string;
      result: undefined;
      data: {
        enableLogging: boolean;
      };
    }
  | {
      action: "utils.generateInboxId";
      id: string;
      result: string;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "utils.getInboxIdForIdentifier";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
        env?: XmtpEnv;
      };
    }
  | {
      action: "utils.revokeInstallationsSignatureText";
      id: string;
      result: string;
      data: {
        env?: XmtpEnv;
        identifier: Identifier;
        inboxId: string;
        installationIds: Uint8Array[];
      };
    }
  | {
      action: "utils.revokeInstallations";
      id: string;
      result: undefined;
      data: {
        env?: XmtpEnv;
        signer: SafeSigner;
        inboxId: string;
        installationIds: Uint8Array[];
      };
    }
  | {
      action: "utils.inboxStateFromInboxIds";
      id: string;
      result: SafeInboxState[];
      data: {
        inboxIds: string[];
        env?: XmtpEnv;
      };
    };
