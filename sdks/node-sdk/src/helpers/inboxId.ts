import {
  generateInboxId as generateInboxIdBinding,
  getInboxIdForAddress as getInboxIdForAddressBinding,
} from "@xmtp/node-bindings";
import { ApiUrls, type XmtpEnv } from "@/Client";

export const generateInboxId = (accountAddress: string): string => {
  return generateInboxIdBinding(accountAddress);
};

export const getInboxIdForAddress = async (
  accountAddress: string,
  env: XmtpEnv = "dev",
) => {
  const host = ApiUrls[env];
  const isSecure = host.startsWith("https");
  return getInboxIdForAddressBinding(host, isSecure, accountAddress);
};
