/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as fm from "./fetch.pb"
import * as GoogleProtobufTimestamp from "./google/protobuf/timestamp.pb"

export enum QueryRequestSortDirection {
  SORT_DIRECTION_UNSPECIFIED = "SORT_DIRECTION_UNSPECIFIED",
  SORT_DIRECTION_ASCENDING = "SORT_DIRECTION_ASCENDING",
  SORT_DIRECTION_DESCENDING = "SORT_DIRECTION_DESCENDING",
}

export type Error = {
  code?: string
  message?: string
}

export type Envelope = {
  id?: string
  contentTopic?: string
  timestamp?: GoogleProtobufTimestamp.Timestamp
  message?: Uint8Array
}

export type PublishRequest = {
  contentTopic?: string
  message?: Uint8Array
}

export type PublishResponse = {
}

export type SubscribeRequest = {
  contentTopic?: string
}

export type SubscribeResponse = {
  id?: string
  error?: string
}

export type QueryRequest = {
  contentTopic?: string
  limit?: number
  sortDirection?: QueryRequestSortDirection
}

export type QueryResponse = {
  envelopes?: Envelope[]
}

export class Message {
  static Publish(req: PublishRequest, initReq?: fm.InitReq): Promise<PublishResponse> {
    return fm.fetchReq<PublishRequest, PublishResponse>(`/message/v1/publish`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Subscribe(req: SubscribeRequest, entityNotifier?: fm.NotifyStreamEntityArrival<Envelope>, initReq?: fm.InitReq): Promise<void> {
    return fm.fetchStreamingRequest<SubscribeRequest, Envelope>(`/message/v1/subscribe`, entityNotifier, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Query(req: QueryRequest, initReq?: fm.InitReq): Promise<QueryResponse> {
    return fm.fetchReq<QueryRequest, QueryResponse>(`/message/v1/query`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
}