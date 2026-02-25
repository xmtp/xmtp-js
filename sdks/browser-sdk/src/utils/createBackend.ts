import init, {
  BackendBuilder,
  XmtpEnv as BindingsEnv,
  type Backend,
} from "@xmtp/wasm-bindings";
import type { NetworkOptions, XmtpEnv } from "@/types/options";

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
  await init();
  const env = options?.env ?? "dev";
  let builder = new BackendBuilder(envMap[env]);
  // WASM builder methods consume `self` and return a new instance,
  // so we must reassign from the return value.
  if (options?.apiUrl) builder = builder.setApiUrl(options.apiUrl);
  if (options?.gatewayHost)
    builder = builder.setGatewayHost(options.gatewayHost);
  if (options?.appVersion) builder = builder.setAppVersion(options.appVersion);
  return builder.build();
};
