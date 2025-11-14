import packageJSON from "@/../package.json" with { type: "json" };

const nodeBindings = packageJSON.dependencies["@xmtp/node-bindings"];

export const version = nodeBindings;
