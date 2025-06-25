import type { Identifier } from "@xmtp/wasm-bindings";
import type { ClientOptions } from "@/types/options";
import type { SafeKeyPackageStatus } from "@/utils/conversions";
import type { SafeSigner } from "@/utils/signer";

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
      action: "client.applySignatureRequest";
      id: string;
      result: undefined;
      data: {
        signer: SafeSigner;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.createInboxSignatureText";
      id: string;
      result: {
        signatureText?: string;
        signatureRequestId?: string;
      };
      data: {
        signatureRequestId: string;
      };
    }
  | {
      action: "client.addAccountSignatureText";
      id: string;
      result: {
        signatureText: string;
        signatureRequestId: string;
      };
      data: {
        newIdentifier: Identifier;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.removeAccountSignatureText";
      id: string;
      result: {
        signatureText: string;
        signatureRequestId: string;
      };
      data: {
        identifier: Identifier;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.revokeAllOtherInstallationsSignatureText";
      id: string;
      result: {
        signatureText: string;
        signatureRequestId: string;
      };
      data: {
        signatureRequestId: string;
      };
    }
  | {
      action: "client.revokeInstallationsSignatureText";
      id: string;
      result: {
        signatureText: string;
        signatureRequestId: string;
      };
      data: {
        installationIds: Uint8Array[];
        signatureRequestId: string;
      };
    }
  | {
      action: "client.changeRecoveryIdentifierSignatureText";
      id: string;
      result: {
        signatureText: string;
        signatureRequestId: string;
      };
      data: {
        identifier: Identifier;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.registerIdentity";
      id: string;
      result: undefined;
      data: {
        signer: SafeSigner;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.addAccount";
      id: string;
      result: undefined;
      data: {
        identifier: Identifier;
        signer: SafeSigner;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.removeAccount";
      id: string;
      result: undefined;
      data: {
        identifier: Identifier;
        signer: SafeSigner;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.revokeAllOtherInstallations";
      id: string;
      result: undefined;
      data: {
        signer: SafeSigner;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.changeRecoveryIdentifier";
      id: string;
      result: undefined;
      data: {
        identifier: Identifier;
        signer: SafeSigner;
        signatureRequestId: string;
      };
    }
  | {
      action: "client.revokeInstallations";
      id: string;
      result: undefined;
      data: {
        installationIds: Uint8Array[];
        signer: SafeSigner;
        signatureRequestId: string;
      };
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
