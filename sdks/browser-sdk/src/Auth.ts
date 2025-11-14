import {
  AuthHandle as WasmAuthHandle,
  Credential as WasmCredential,
} from "@xmtp/wasm-bindings";

export interface Credential {
  name?: string;
  value: string;
  expiresAt: Date;
}

export function toWasmCredential(credential: Credential): WasmCredential {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return new WasmCredential(
    credential.name ?? undefined,
    credential.value,
    BigInt(Math.floor(credential.expiresAt.getTime() / 1000)),
  );
}

export type AuthCallback = () => Promise<Credential>;

export class AuthHandle {
  readonly handle: WasmAuthHandle;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    this.handle = new WasmAuthHandle();
  }

  async set(credential: Credential): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.handle.set(toWasmCredential(credential));
  }

  id(): bigint {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return BigInt(this.handle.id() as number);
  }
}

export function createAuthCallback(
  callback: AuthCallback,
): () => Promise<WasmCredential> {
  return async () => {
    try {
      const cred = await callback();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return toWasmCredential(cred);
    } catch (error) {
      console.error("Auth callback error:", error);
      throw error; // Re-throw to match expected type
    }
  };
}
