import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ClientVerifySignature extends BaseCommand {
  static description = `Verify a signature created with an installation key.

Validates that a signature was created by this client's installation key.
The signature must have been created using the 'client sign' command or
the signWithInstallationKey SDK method.

This is useful for:
- Verifying authenticity of messages signed by this installation
- Implementing custom authentication/authorization flows
- Validating attestations created by this client

The signature can be provided in either hex or base64 encoding.`;

  static examples = [
    {
      command:
        '<%= config.bin %> <%= command.id %> "Hello, World!" --signature <hex-signature>',
      description: "Verify a hex-encoded signature",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> "verify me" --signature <base64-signature> --base64',
      description: "Verify a base64-encoded signature",
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> "auth-token" -s <signature> --json',
      description: "Verify and output result as JSON",
    },
  ];

  static args = {
    message: Args.string({
      description: "The original message that was signed",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    signature: Flags.string({
      char: "s",
      description: "Signature to verify (hex or base64)",
      required: true,
    }),
    base64: Flags.boolean({
      description: "Interpret signature as base64 instead of hex",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ClientVerifySignature);
    const client = await this.initClient();

    const signatureBytes = flags.base64
      ? Buffer.from(flags.signature, "base64")
      : Buffer.from(flags.signature, "hex");

    const isValid = client.verifySignedWithInstallationKey(
      args.message,
      new Uint8Array(signatureBytes),
    );

    this.output({
      message: args.message,
      isValid,
      installationId: client.installationId,
    });
  }
}
