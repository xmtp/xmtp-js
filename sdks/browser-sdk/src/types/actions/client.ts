import type { Identifier, SignatureRequestType } from "@xmtp/wasm-bindings";
import type { ClientOptions } from "@/types/options";
import type { SafeKeyPackageStatus } from "@/utils/conversions";

export type ClientAction =
  | {
      action: "client.init";
      id: string;
      result: {
        inboxId: string;
        installationId: string;
        installationIdBytes: Uint8Array;
      };
      data: {
        identifier: Identifier;
        options?: ClientOptions;
      };
    }
  | {
      action: "client.createInboxSignatureText";
      id: string;
      result: string | undefined;
      data: undefined;
    }
  | {
      action: "client.addAccountSignatureText";
      id: string;
      result: string | undefined;
      data: {
        newIdentifier: Identifier;
      };
    }
  | {
      action: "client.removeAccountSignatureText";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "client.revokeAllOtherInstallationsSignatureText";
      id: string;
      result: string | undefined;
      data: undefined;
    }
  | {
      action: "client.revokeInstallationsSignatureText";
      id: string;
      result: string | undefined;
      data: {
        installationIds: Uint8Array[];
      };
    }
  | {
      action: "client.changeRecoveryIdentifierSignatureText";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "client.addEcdsaSignature";
      id: string;
      result: undefined;
      data: {
        type: SignatureRequestType;
        bytes: Uint8Array;
      };
    }
  | {
      action: "client.addScwSignature";
      id: string;
      result: undefined;
      data: {
        type: SignatureRequestType;
        bytes: Uint8Array;
        chainId: bigint;
        blockNumber?: bigint;
      };
    }
  | {
      action: "client.applySignatures";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "client.registerIdentity";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "client.isRegistered";
      id: string;
      result: boolean;
      data: undefined;
    }
  | {
      action: "client.canMessage";
      id: string;
      result: Map<string, boolean>;
      data: {
        identifiers: Identifier[];
      };
    }
  | {
      action: "client.findInboxIdByIdentifier";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "client.signWithInstallationKey";
      id: string;
      result: Uint8Array;
      data: {
        signatureText: string;
      };
    }
  | {
      action: "client.verifySignedWithInstallationKey";
      id: string;
      result: boolean;
      data: {
        signatureText: string;
        signatureBytes: Uint8Array;
      };
    }
  | {
      action: "client.verifySignedWithPublicKey";
      id: string;
      result: boolean;
      data: {
        signatureText: string;
        signatureBytes: Uint8Array;
        publicKey: Uint8Array;
      };
    }
  | {
      action: "client.getKeyPackageStatusesForInstallationIds";
      id: string;
      result: Map<string, SafeKeyPackageStatus>;
      data: {
        installationIds: string[];
      };
    };
