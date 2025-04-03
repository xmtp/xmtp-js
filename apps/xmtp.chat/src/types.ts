import type { PermissionPolicySet } from "@xmtp/browser-sdk";

type AnyFn = (...args: unknown[]) => unknown;
type ClassProperties<C> = {
  [K in keyof C as C[K] extends AnyFn ? never : K]: C[K];
};

export type PolicySet = ClassProperties<PermissionPolicySet>;
