import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../baseCommand.js";

export default class ClientSign extends BaseCommand {
  static description = `Sign a message with the client's installation key.

Creates a cryptographic signature of the provided message using the
installation's private key. This signature can be used to prove that
a message was signed by this specific XMTP installation.

The signature is returned as a hex-encoded string by default, or as
base64 with the --base64 flag.

Use cases:
- Proving ownership of an XMTP installation
- Creating verifiable attestations
- Implementing custom authentication flows`;

  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> "Hello, World!"',
      description: "Sign a simple message",
    },
    {
      command: '<%= config.bin %> <%= command.id %> "verify me" --base64',
      description: "Sign a message and output as base64",
    },
    {
      command: '<%= config.bin %> <%= command.id %> "auth-token-123" --json',
      description: "Sign a message with JSON output for scripting",
    },
  ];

  static args = {
    message: Args.string({
      description: "The message to sign",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    base64: Flags.boolean({
      description: "Output signature as base64 instead of hex",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ClientSign);
    const client = await this.initClient();

    const signatureBytes = client.signWithInstallationKey(args.message);
    const signature = flags.base64
      ? Buffer.from(signatureBytes).toString("base64")
      : Buffer.from(signatureBytes).toString("hex");

    this.output({
      message: args.message,
      signature,
      encoding: flags.base64 ? "base64" : "hex",
      installationId: client.installationId,
    });
  }
}
