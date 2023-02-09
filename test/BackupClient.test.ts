import assert from 'assert'
import { BackupType } from '../src/message-backup/BackupClient'
import { newLocalHostClient, newDevClient } from './helpers'

describe('Backup configuration', () => {
  it('Uses XMTP backup for localhost', async function () {
    const c = await newLocalHostClient()
    assert.equal(c.backupType, BackupType.xmtp)
  })
  if (process.env.CI || process.env.TESTNET) {
    it('Uses no backup for dev', async function () {
      const c = await newDevClient()
      assert.equal(c.backupType, BackupType.none)
    })
  }
})
