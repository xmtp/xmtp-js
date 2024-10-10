import { BackupType } from "@/message-backup/BackupClient";
import { newDevClient, newLocalHostClient } from "./helpers";

describe("Backup configuration", () => {
  it("Uses XMTP backup for localhost", async function () {
    const c = await newLocalHostClient();
    expect(c.backupType).toEqual(BackupType.xmtpTopicStore);
  });
  if (process.env.CI || process.env.TESTNET) {
    it("Uses no backup for dev", async function () {
      const c = await newDevClient();
      expect(c.backupType).toEqual(BackupType.none);
    });
  }
});
