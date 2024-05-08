import { keystore } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import Long from 'long'
import type { KeystoreInterfaces } from '@/keystore/rpcDefinitions'
import { dateToNs, nsToDate } from '@/utils/date'

const CLOCK_SKEW_OFFSET_MS = 10000

type JobType = 'v1' | 'v2' | 'user-preferences'

type UpdateJob<T> = (lastRun: Date | undefined) => Promise<T>

export default class JobRunner {
  readonly jobType: JobType
  readonly mutex: Mutex
  readonly keystore: KeystoreInterfaces
  disableOffset: boolean = false

  constructor(jobType: JobType, keystore: KeystoreInterfaces) {
    this.jobType = jobType
    this.mutex = new Mutex()
    this.keystore = keystore
  }

  get protoJobType(): keystore.JobType {
    return getProtoJobType(this.jobType)
  }

  async run<T>(callback: UpdateJob<T>): Promise<T> {
    return this.mutex.runExclusive(async () => {
      const lastRun = await this.getLastRunTime()
      const startTime = new Date()
      const result = await callback(
        lastRun
          ? !this.disableOffset
            ? new Date(lastRun.getTime() - CLOCK_SKEW_OFFSET_MS)
            : lastRun
          : undefined
      )
      await this.setLastRunTime(startTime)
      return result
    })
  }

  async resetLastRunTime() {
    await this.keystore.setRefreshJob({
      jobType: this.protoJobType,
      lastRunNs: dateToNs(new Date(0)),
    })
  }

  private async getLastRunTime(): Promise<Date | undefined> {
    const { lastRunNs } = await this.keystore.getRefreshJob(
      keystore.GetRefreshJobRequest.fromPartial({
        jobType: this.protoJobType,
      })
    )
    if (lastRunNs.equals(Long.fromNumber(0))) {
      return undefined
    }
    return nsToDate(lastRunNs)
  }

  private async setLastRunTime(lastRun: Date): Promise<void> {
    await this.keystore.setRefreshJob({
      jobType: this.protoJobType,
      lastRunNs: dateToNs(lastRun),
    })
  }
}

function getProtoJobType(jobType: JobType): keystore.JobType {
  const protoJobType = {
    v1: keystore.JobType.JOB_TYPE_REFRESH_V1,
    v2: keystore.JobType.JOB_TYPE_REFRESH_V2,
    'user-preferences': keystore.JobType.JOB_TYPE_REFRESH_PPPP,
  }[jobType]

  if (!protoJobType) {
    throw new Error(`unknown job type: ${jobType}`)
  }

  return protoJobType
}
