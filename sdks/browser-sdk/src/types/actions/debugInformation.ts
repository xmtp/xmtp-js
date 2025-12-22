import type { ApiStats, IdentityStats } from "@xmtp/wasm-bindings";

export type DebugInformationAction =
  | {
      action: "debugInformation.apiStatistics";
      id: string;
      result: ApiStats;
      data: undefined;
    }
  | {
      action: "debugInformation.apiIdentityStatistics";
      id: string;
      result: IdentityStats;
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
    };
