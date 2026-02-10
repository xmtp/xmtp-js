import { Help } from "@oclif/core";

export default class CustomHelp extends Help {
  async showRootHelp(): Promise<void> {
    await super.showRootHelp();

    this.log(
      this.section(
        "GETTING STARTED",
        this.wrap(
          [
            "Initialize your client with wallet and encryption keys:",
            "",
            "  $ xmtp init",
            "",
            "Create a group and send a message:",
            "",
            "  $ xmtp conversations create-group <address-1> <address-2> --name 'My Group'",
            "  $ xmtp conversation send-text <conversation-id> 'Hello!'",
            "",
            "Create a DM and send a message:",
            "",
            "  $ xmtp conversations create-dm <address>",
            "  $ xmtp conversation send-text <conversation-id> 'Hello!'",
            "",
            "Run 'xmtp <command> --help' for more information on a command.",
          ].join("\n"),
        ),
      ),
    );
    this.log("");
  }
}
