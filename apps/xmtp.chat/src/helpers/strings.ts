import { ApiUrls, type XmtpEnv } from "@xmtp/browser-sdk";

export type AppEnv = XmtpEnv | "d14n-dev" | "d14n-staging" | "testnet";

export const D14N_GATEWAY_HOSTS: Record<string, string> = {
  "d14n-dev": "https://payer.testnet-dev.xmtp.network",
  "d14n-staging": "https://payer.testnet-staging.xmtp.network",
  testnet: "https://payer.testnet.xmtp.network",
};

export const isD14nEnv = (env: string): boolean => env in D14N_GATEWAY_HOSTS;

export const getSdkEnv = (env: AppEnv): XmtpEnv => {
  if (isD14nEnv(env)) return "dev";
  return env as XmtpEnv;
};

export const getD14nGatewayHost = (env: AppEnv): string =>
  D14N_GATEWAY_HOSTS[env];

export const networkOptions = [
  { value: "local", label: "Local" },
  { value: "dev", label: "Dev" },
  { value: "production", label: "Production" },
  { value: "d14n-dev", label: "D14N Dev" },
  { value: "d14n-staging", label: "D14N Staging" },
  { value: "testnet", label: "D14N Testnet" },
];

export const getNetworkUrl = (env: AppEnv): string => {
  if (isD14nEnv(env)) return getD14nGatewayHost(env);
  return ApiUrls[env as keyof typeof ApiUrls];
};

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
  [
    "production",
    "dev",
    "local",
    "d14n-dev",
    "d14n-staging",
    "testnet",
  ].includes(env);

export const jsonStringify = (value: unknown): string =>
  JSON.stringify(
    value,
    (_, value: unknown) =>
      typeof value === "bigint" ? value.toString() : value,
    2,
  );
