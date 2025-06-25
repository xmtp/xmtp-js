import type { SafeApiStats, SafeIdentityStats } from "@/utils/conversions";

export type DebugInformationAction =
  | {
      action: "debugInformation.apiStatistics";
      id: string;
      result: SafeApiStats;
      data: undefined;
    }
  | {
      action: "debugInformation.apiIdentityStatistics";
      id: string;
      result: SafeIdentityStats;
      data: undefined;
    }
  | {
      action: "debugInformation.apiAggregateStatistics";
      id: string;
      result: string;
      data: undefined;
    }
  | {
      action: "debugInformation.clearAllStatistics";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "debugInformation.uploadDebugArchive";
      id: string;
      result: string;
      data: {
        serverUrl?: string;
      };
    };
