import bindingsVersion from "@xmtp/node-bindings/version.json" with { type: "json" };

export const version = `${bindingsVersion.branch}@${bindingsVersion.version} (${bindingsVersion.date})`;
