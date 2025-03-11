import {
  generateInboxId as generateInboxIdBinding,
  getInboxIdForIdentifier as getInboxIdForIdentifierBinding,
  type Identifier,
} from "@xmtp/node-bindings";
import { ApiUrls, type XmtpEnv } from "@/Client";

export const generateInboxId = (identifier: Identifier): string => {
  return generateInboxIdBinding(identifier);
};

export const getInboxIdForIdentifier = async (
  identifier: Identifier,
  env: XmtpEnv = "dev",
) => {
  const host = ApiUrls[env];
  const isSecure = host.startsWith("https");
  return getInboxIdForIdentifierBinding(host, isSecure, identifier);
};
