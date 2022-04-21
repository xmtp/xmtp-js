import { Reader } from 'protobufjs/minimal'
import { v4 as uuid } from 'uuid'

import * as proto from '../proto/waku/filter'

export type ContentFilter = {
  contentTopic: string
}

export class FilterRPC {
  public proto: proto.FilterRPC
  constructor(protoFilter: proto.FilterRPC) {
    this.proto = protoFilter
  }

  static createRequest(
    topic: string,
    contentFilters: ContentFilter[],
    requestId?: string,
    subscribe = true
  ): FilterRPC {
    return new FilterRPC({
      requestId: requestId || uuid(),
      request: {
        subscribe,
        topic,
        contentFilters,
      },
      push: undefined,
    })
  }

  static decode(bytes: Uint8Array): FilterRPC {
    const res = proto.FilterRPC.decode(Reader.create(bytes))
    return new FilterRPC(res)
  }

  encode(): Uint8Array {
    return proto.FilterRPC.encode(this.proto).finish()
  }

  get push(): proto.MessagePush | undefined {
    return this.proto.push
  }

  get requestId(): string {
    return this.proto.requestId
  }
}
