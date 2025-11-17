import {
  FfiAuthCallback,
  FfiAuthHandle,
  type FfiCredential,
} from "@xmtp/node-bindings";

export interface Credential {
  name?: string;
  value: string;
  expiresAt: Date;
}

const toFfiCredential = (credential: Credential): FfiCredential => {
  return {
    name: credential.name,
    value: credential.value,
    expiresAtSeconds: Math.floor(credential.expiresAt.getTime() / 1000),
  };
};

export type AuthCallback = () => Promise<Credential>;

export class AuthHandle {
  readonly handle: FfiAuthHandle;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    this.handle = new FfiAuthHandle();
  }

  async set(credential: Credential): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.handle.set(toFfiCredential(credential));
  }

  id(): bigint {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return this.handle.id();
  }
}

export const createAuthCallback = (callback: AuthCallback): FfiAuthCallback => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return new FfiAuthCallback(async () => {
    try {
      const cred = await callback();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return toFfiCredential(cred);
    } catch (error) {
      console.error("Auth callback error:", error);
      throw error; // Re-throw to match expected type
    }
  });
};
