import { logError } from "./errors";

// Namestone API types
export type NamestoneSetNameRequest = {
  name: string;
  domain: string;
  address: string;
  text_records?: Record<string, string>;
  coin_types?: Record<string, string>;
};

export type NamestoneDeleteNameRequest = {
  name: string;
  domain: string;
};

export type NamestoneResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

class NamestoneService {
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.NAMESTONE_API_KEY || "";
    this.domain = process.env.NAMESTONE_DOMAIN || "";
    this.baseUrl =
      process.env.NAMESTONE_BASE_URL || "https://namestone.com/api/public_v1";

    if (!this.apiKey) {
      console.warn(
        "NAMESTONE_API_KEY not configured - Namestone integration disabled",
      );
    }
    if (!this.domain) {
      console.warn(
        "NAMESTONE_DOMAIN not configured - Namestone integration disabled",
      );
    }
  }

  private isEnabled(): boolean {
    return !!(this.apiKey && this.domain);
  }

  /**
   * Sets a name (subdomain) for a given address and domain
   */
  async setName(args: {
    username: string;
    address: string;
    textRecords?: Record<string, string>;
  }): Promise<NamestoneResponse> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: "Namestone service not configured",
      };
    }

    try {
      const requestBody: NamestoneSetNameRequest = {
        name: args.username,
        domain: this.domain,
        address: args.address,
        text_records: args.textRecords,
      };

      const response = await fetch(`${this.baseUrl}/set-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = (await response.json()) as NamestoneResponse;
      return {
        ...result,
        success: true,
        message: `Successfully set name ${args.username}.${this.domain}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logError("Failed to set Namestone name", {
        username: args.username,
        domain: this.domain,
        address: args.address,
        error: errorMessage,
      });

      return {
        success: false,
        error: `Failed to set name: ${errorMessage}`,
      };
    }
  }

  /**
   * Deletes a name (subdomain) for a given domain
   */
  async deleteName(args: { username: string }): Promise<NamestoneResponse> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: "Namestone service not configured",
      };
    }

    try {
      const requestBody: NamestoneDeleteNameRequest = {
        name: args.username,
        domain: this.domain,
      };

      const response = await fetch(`${this.baseUrl}/delete-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = (await response.json()) as NamestoneResponse;
      return {
        ...result,
        success: true,
        message: `Successfully deleted name ${args.username}.${this.domain}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logError("Failed to delete Namestone name", {
        username: args.username,
        domain: this.domain,
        error: errorMessage,
      });

      return {
        success: false,
        error: `Failed to delete name: ${errorMessage}`,
      };
    }
  }
}

// Export singleton instance
export const namestoneService = new NamestoneService();
