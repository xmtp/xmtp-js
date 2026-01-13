import type { SafeConversation } from "@/utils/conversions";

export type DmAction =
  | {
      action: "dm.peerInboxId";
      id: string;
      result: string;
      data: {
        id: string;
      };
    }
  | {
      action: "dm.duplicateDms";
      id: string;
      result: SafeConversation[];
      data: {
        id: string;
      };
    };
