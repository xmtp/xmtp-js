import type { XmtpEnv } from "@xmtp/browser-sdk";

export type AppEnv = XmtpEnv | "d14n-dev" | "d14n-staging";

export const D14N_GATEWAY_HOSTS: Record<string, string> = {
  "d14n-dev": "https://payer.testnet-dev.xmtp.network",
  "d14n-staging": "https://payer.testnet-staging.xmtp.network",
};

export const isD14nEnv = (env: string): boolean => env.startsWith("d14n-");

export const getSdkEnv = (env: AppEnv): XmtpEnv => {
  if (isD14nEnv(env)) return "dev";
  return env as XmtpEnv;
};

export const getD14nGatewayHost = (env: AppEnv): string | undefined =>
  D14N_GATEWAY_HOSTS[env];

export const isValidEthereumAddress = (
  address: string,
): address is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(address);

export const isValidInboxId = (inboxId: string): inboxId is string =>
  /^[a-z0-9]{64}$/.test(inboxId);

export const shortAddress = (address: string, length: number = 4): string => {
  if (!isValidEthereumAddress(address) && !isValidInboxId(address)) {
    return address;
  }
  return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
};

export const MEMBER_NO_LONGER_IN_GROUP =
  "This member is no longer in the group";

export const isValidEnvironment = (env: string): env is AppEnv =>
  ["production", "dev", "local", "d14n-dev", "d14n-staging"].includes(env);

export const jsonStringify = (value: unknown): string =>
  JSON.stringify(
    value,
    (_, value: unknown) =>
      typeof value === "bigint" ? value.toString() : value,
    2,
  );
