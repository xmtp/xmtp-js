import type { MiniAppAction } from "./actions";

export type MiniAppActionMetadata = {
  id?: string;
  fromInboxId?: string;
};

export type MiniAppManifest = {
  appStoreUrl?: string;
  author: string;
  description?: string;
  icon?: string;
  name: string;
  schemaVersion: "1";
  url?: string;
  version: string;
};

export type MiniAppActionContent<T extends MiniAppAction = MiniAppAction> = {
  type: "action";
  manifest: MiniAppManifest;
  metadata?: MiniAppActionMetadata;
  action: T;
};

export type MiniAppResponseContent = {
  type: "response";
  metadata?: MiniAppActionMetadata;
  uuid: string;
  data: Uint8Array;
};

export type MiniAppContent = MiniAppActionContent | MiniAppResponseContent;
