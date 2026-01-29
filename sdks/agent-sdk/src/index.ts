import { isGroupUpdated } from "@xmtp/node-sdk";

export * from "@xmtp/node-sdk";
// Agent SDK
export * from "./core/index";
export * from "./debug/index";
export * from "./middleware/index";
export * from "./user/index";
export * from "./util/index";

// keep for backwards compatibility
/** @deprecated use isGroupUpdated instead */
const isGroupUpdate = isGroupUpdated;

export { isGroupUpdate };
