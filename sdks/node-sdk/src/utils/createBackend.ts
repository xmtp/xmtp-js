import {
  BackendBuilder,
  XmtpEnv as BindingsEnv,
  type Backend,
} from "@xmtp/node-bindings";
import type { NetworkOptions, XmtpEnv } from "@/types";

const envMap: Record<XmtpEnv, BindingsEnv> = {
  local: BindingsEnv.Local,
  dev: BindingsEnv.Dev,
  production: BindingsEnv.Production,
  "testnet-staging": BindingsEnv.TestnetStaging,
  "testnet-dev": BindingsEnv.TestnetDev,
  testnet: BindingsEnv.Testnet,
  mainnet: BindingsEnv.Mainnet,
};

const reverseEnvMap: Record<BindingsEnv, XmtpEnv> = {
  [BindingsEnv.Local]: "local",
  [BindingsEnv.Dev]: "dev",
  [BindingsEnv.Production]: "production",
  [BindingsEnv.TestnetStaging]: "testnet-staging",
  [BindingsEnv.TestnetDev]: "testnet-dev",
  [BindingsEnv.Testnet]: "testnet",
  [BindingsEnv.Mainnet]: "mainnet",
};

export const envToString = (env: BindingsEnv): XmtpEnv => {
  return reverseEnvMap[env];
};

export const createBackend = async (
  options?: NetworkOptions,
): Promise<Backend> => {
  const env = options?.env ?? "dev";
  const builder = new BackendBuilder(envMap[env]);
  if (options?.apiUrl) builder.setApiUrl(options.apiUrl);
  if (options?.gatewayHost) builder.setGatewayHost(options.gatewayHost);
  if (options?.appVersion) builder.setAppVersion(options.appVersion);
  return builder.build();
};
