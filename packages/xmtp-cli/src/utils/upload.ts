import type { XmtpConfig } from "./config.js";

export interface UploadProvider {
  name: string;
  upload(data: Uint8Array, filename: string, mimeType: string): Promise<string>;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

class PinataProvider implements UploadProvider {
  name = "pinata";
  #jwt: string;
  #gateway: string;

  constructor(jwt: string, gateway?: string) {
    this.#jwt = jwt;
    this.#gateway =
      gateway?.replace(/\/$/, "") ?? "https://gateway.pinata.cloud";
  }

  async upload(
    data: Uint8Array,
    filename: string,
    _mimeType: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", new Blob([data]), filename);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.#jwt}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pinata upload failed (${response.status}): ${text}`);
    }

    const result = (await response.json()) as PinataResponse;
    return `${this.#gateway}/ipfs/${result.IpfsHash}`;
  }
}

const PROVIDER_FACTORIES = {
  pinata: (config: XmtpConfig) => {
    if (!config.uploadProviderToken) {
      throw new Error(
        "Pinata requires a JWT token. Set XMTP_UPLOAD_PROVIDER_TOKEN or use --upload-provider-token.",
      );
    }
    return new PinataProvider(
      config.uploadProviderToken,
      config.uploadProviderGateway,
    );
  },
} satisfies Record<string, (config: XmtpConfig) => UploadProvider>;

type ProviderName = keyof typeof PROVIDER_FACTORIES;

function isProviderName(name: string): name is ProviderName {
  return Object.hasOwn(PROVIDER_FACTORIES, name);
}

export function getUploadProvider(config: XmtpConfig): UploadProvider | null {
  if (!config.uploadProvider) {
    return null;
  }

  if (!isProviderName(config.uploadProvider)) {
    const available = Object.keys(PROVIDER_FACTORIES).join(", ");
    throw new Error(
      `Unknown upload provider: ${config.uploadProvider}. Available: ${available}`,
    );
  }

  return PROVIDER_FACTORIES[config.uploadProvider](config);
}

/** Max size for inline attachments (bytes). Files larger than this
 *  are automatically sent as remote attachments when a provider is configured. */
export const INLINE_ATTACHMENT_MAX_BYTES = 1_000_000;
