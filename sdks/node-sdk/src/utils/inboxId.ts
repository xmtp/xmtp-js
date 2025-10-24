import {
  generateInboxId as generateInboxIdBinding,
  getInboxIdForIdentifier as getInboxIdForIdentifierBinding,
  type Identifier,
} from "@xmtp/node-bindings";
import { ApiUrls } from "@/constants";
import type { XmtpEnv } from "@/types";

export const generateInboxId = (identifier: Identifier): string => {
  return generateInboxIdBinding(identifier);
};

export const getInboxIdForIdentifier = async (
  identifier: Identifier,
  env: XmtpEnv = "dev",
  gatewayHost?: string,
) => {
  const host = ApiUrls[env];
  const isSecure = host.startsWith("https");
  return getInboxIdForIdentifierBinding(
    host,
    gatewayHost,
    isSecure,
    identifier,
  );
};
