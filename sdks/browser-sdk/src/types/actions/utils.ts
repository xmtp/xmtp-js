import type { Identifier } from "@xmtp/wasm-bindings";
import type { XmtpEnv } from "@/types/options";

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
    };
