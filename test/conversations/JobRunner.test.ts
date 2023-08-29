import {
  InMemoryKeystore,
  InMemoryPersistence,
  Keystore,
  PrivateKeyBundleV1,
  nsToDate,
} from '../../src'
import { keystore as keystoreProto } from '@xmtp/proto'
import JobRunner from '../../src/conversations/JobRunner'
import { newWallet, sleep } from '../helpers'

describe('JobRunner', () => {
  let keystore: Keystore

  beforeEach(async () => {
    const bundle = await PrivateKeyBundleV1.generate(newWallet())
    keystore = await InMemoryKeystore.create(
      bundle,
      InMemoryPersistence.create()
    )
  })

  it('can set the job time correctly', async () => {
    const v1Runner = new JobRunner('v1', keystore)
    await v1Runner.run(async (lastRun) => {
      expect(lastRun).toBeUndefined()
    })

    const { lastRunNs } = await keystore.getRefreshJob({
      jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_V1,
    })

    // We don't know the exact timestamp that the runner will set from outside, so just assume it was within a second of now
    expect(new Date().getTime() - nsToDate(lastRunNs).getTime()).toBeLessThan(
      1000
    )
  })

  it('sets different values for v1 and v2 runners', async () => {
    const v1Runner = new JobRunner('v1', keystore)
    const v2Runner = new JobRunner('v2', keystore)

    await v1Runner.run(async () => {})
    // Ensure they have different timestamps
    await sleep(10)
    await v2Runner.run(async () => {})

    const { lastRunNs: v1LastRunNs } = await keystore.getRefreshJob({
      jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_V1,
    })
    const { lastRunNs: v2LastRunNs } = await keystore.getRefreshJob({
      jobType: keystoreProto.JobType.JOB_TYPE_REFRESH_V2,
    })

    expect(v1LastRunNs.gt(0)).toBeTruthy()
    expect(v2LastRunNs.gt(0)).toBeTruthy()
    expect(v1LastRunNs.eq(v2LastRunNs)).toBe(false)
  })

  it('fails with an invalid job type', async () => {
    // @ts-ignore-next-line
    const v3Runner = new JobRunner('v3', keystore)
    expect(v3Runner.run(async () => {})).rejects.toThrow('unknown job type: v3')
  })

  it('returns the value from the callback', async () => {
    const v1Runner = new JobRunner('v1', keystore)

    const result = await v1Runner.run(async () => {
      return 'foo'
    })
    expect(result).toBe('foo')
  })

  it('bubbles up errors from the callback', async () => {
    const v1Runner = new JobRunner('v1', keystore)

    await expect(
      v1Runner.run(async () => {
        throw new Error('foo')
      })
    ).rejects.toThrow('foo')
  })
})
