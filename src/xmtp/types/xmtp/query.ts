/* eslint-disable */
import { Reader, Writer } from "protobufjs/minimal";
import { Params } from "../xmtp/params";
import {
  PageRequest,
  PageResponse,
} from "../cosmos/base/query/v1beta1/pagination";
import { Message } from "../xmtp/message";
import { Contact } from "../xmtp/contact";

export const protobufPackage = "xmtp.xmtp";

/** QueryParamsRequest is request type for the Query/Params RPC method. */
export interface QueryParamsRequest {}

/** QueryParamsResponse is response type for the Query/Params RPC method. */
export interface QueryParamsResponse {
  /** params holds all the parameters of this module. */
  params: Params | undefined;
}

export interface QueryMessagesRequest {
  pagination: PageRequest | undefined;
  topic: string;
}

export interface QueryMessagesResponse {
  messages: Message[];
  pagination: PageResponse | undefined;
}

export interface QueryContactRequest {
  id: string;
}

export interface QueryContactResponse {
  contact: Contact | undefined;
}

const baseQueryParamsRequest: object = {};

export const QueryParamsRequest = {
  encode(_: QueryParamsRequest, writer: Writer = Writer.create()): Writer {
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): QueryParamsRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseQueryParamsRequest } as QueryParamsRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): QueryParamsRequest {
    const message = { ...baseQueryParamsRequest } as QueryParamsRequest;
    return message;
  },

  toJSON(_: QueryParamsRequest): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: DeepPartial<QueryParamsRequest>): QueryParamsRequest {
    const message = { ...baseQueryParamsRequest } as QueryParamsRequest;
    return message;
  },
};

const baseQueryParamsResponse: object = {};

export const QueryParamsResponse = {
  encode(
    message: QueryParamsResponse,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.params !== undefined) {
      Params.encode(message.params, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): QueryParamsResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseQueryParamsResponse } as QueryParamsResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.params = Params.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): QueryParamsResponse {
    const message = { ...baseQueryParamsResponse } as QueryParamsResponse;
    if (object.params !== undefined && object.params !== null) {
      message.params = Params.fromJSON(object.params);
    } else {
      message.params = undefined;
    }
    return message;
  },

  toJSON(message: QueryParamsResponse): unknown {
    const obj: any = {};
    message.params !== undefined &&
      (obj.params = message.params ? Params.toJSON(message.params) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<QueryParamsResponse>): QueryParamsResponse {
    const message = { ...baseQueryParamsResponse } as QueryParamsResponse;
    if (object.params !== undefined && object.params !== null) {
      message.params = Params.fromPartial(object.params);
    } else {
      message.params = undefined;
    }
    return message;
  },
};

const baseQueryMessagesRequest: object = { topic: "" };

export const QueryMessagesRequest = {
  encode(
    message: QueryMessagesRequest,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.pagination !== undefined) {
      PageRequest.encode(message.pagination, writer.uint32(10).fork()).ldelim();
    }
    if (message.topic !== "") {
      writer.uint32(18).string(message.topic);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): QueryMessagesRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseQueryMessagesRequest } as QueryMessagesRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.pagination = PageRequest.decode(reader, reader.uint32());
          break;
        case 2:
          message.topic = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): QueryMessagesRequest {
    const message = { ...baseQueryMessagesRequest } as QueryMessagesRequest;
    if (object.pagination !== undefined && object.pagination !== null) {
      message.pagination = PageRequest.fromJSON(object.pagination);
    } else {
      message.pagination = undefined;
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = String(object.topic);
    } else {
      message.topic = "";
    }
    return message;
  },

  toJSON(message: QueryMessagesRequest): unknown {
    const obj: any = {};
    message.pagination !== undefined &&
      (obj.pagination = message.pagination
        ? PageRequest.toJSON(message.pagination)
        : undefined);
    message.topic !== undefined && (obj.topic = message.topic);
    return obj;
  },

  fromPartial(object: DeepPartial<QueryMessagesRequest>): QueryMessagesRequest {
    const message = { ...baseQueryMessagesRequest } as QueryMessagesRequest;
    if (object.pagination !== undefined && object.pagination !== null) {
      message.pagination = PageRequest.fromPartial(object.pagination);
    } else {
      message.pagination = undefined;
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = object.topic;
    } else {
      message.topic = "";
    }
    return message;
  },
};

const baseQueryMessagesResponse: object = {};

export const QueryMessagesResponse = {
  encode(
    message: QueryMessagesResponse,
    writer: Writer = Writer.create()
  ): Writer {
    for (const v of message.messages) {
      Message.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.pagination !== undefined) {
      PageResponse.encode(
        message.pagination,
        writer.uint32(18).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): QueryMessagesResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseQueryMessagesResponse } as QueryMessagesResponse;
    message.messages = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.messages.push(Message.decode(reader, reader.uint32()));
          break;
        case 2:
          message.pagination = PageResponse.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): QueryMessagesResponse {
    const message = { ...baseQueryMessagesResponse } as QueryMessagesResponse;
    message.messages = [];
    if (object.messages !== undefined && object.messages !== null) {
      for (const e of object.messages) {
        message.messages.push(Message.fromJSON(e));
      }
    }
    if (object.pagination !== undefined && object.pagination !== null) {
      message.pagination = PageResponse.fromJSON(object.pagination);
    } else {
      message.pagination = undefined;
    }
    return message;
  },

  toJSON(message: QueryMessagesResponse): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) =>
        e ? Message.toJSON(e) : undefined
      );
    } else {
      obj.messages = [];
    }
    message.pagination !== undefined &&
      (obj.pagination = message.pagination
        ? PageResponse.toJSON(message.pagination)
        : undefined);
    return obj;
  },

  fromPartial(
    object: DeepPartial<QueryMessagesResponse>
  ): QueryMessagesResponse {
    const message = { ...baseQueryMessagesResponse } as QueryMessagesResponse;
    message.messages = [];
    if (object.messages !== undefined && object.messages !== null) {
      for (const e of object.messages) {
        message.messages.push(Message.fromPartial(e));
      }
    }
    if (object.pagination !== undefined && object.pagination !== null) {
      message.pagination = PageResponse.fromPartial(object.pagination);
    } else {
      message.pagination = undefined;
    }
    return message;
  },
};

const baseQueryContactRequest: object = { id: "" };

export const QueryContactRequest = {
  encode(
    message: QueryContactRequest,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): QueryContactRequest {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseQueryContactRequest } as QueryContactRequest;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): QueryContactRequest {
    const message = { ...baseQueryContactRequest } as QueryContactRequest;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    return message;
  },

  toJSON(message: QueryContactRequest): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial(object: DeepPartial<QueryContactRequest>): QueryContactRequest {
    const message = { ...baseQueryContactRequest } as QueryContactRequest;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    return message;
  },
};

const baseQueryContactResponse: object = {};

export const QueryContactResponse = {
  encode(
    message: QueryContactResponse,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.contact !== undefined) {
      Contact.encode(message.contact, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): QueryContactResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseQueryContactResponse } as QueryContactResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.contact = Contact.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): QueryContactResponse {
    const message = { ...baseQueryContactResponse } as QueryContactResponse;
    if (object.contact !== undefined && object.contact !== null) {
      message.contact = Contact.fromJSON(object.contact);
    } else {
      message.contact = undefined;
    }
    return message;
  },

  toJSON(message: QueryContactResponse): unknown {
    const obj: any = {};
    message.contact !== undefined &&
      (obj.contact = message.contact
        ? Contact.toJSON(message.contact)
        : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<QueryContactResponse>): QueryContactResponse {
    const message = { ...baseQueryContactResponse } as QueryContactResponse;
    if (object.contact !== undefined && object.contact !== null) {
      message.contact = Contact.fromPartial(object.contact);
    } else {
      message.contact = undefined;
    }
    return message;
  },
};

/** Query defines the gRPC querier service. */
export interface Query {
  /** Parameters queries the parameters of the module. */
  Params(request: QueryParamsRequest): Promise<QueryParamsResponse>;
  /** Queries a list of Messages items. */
  Messages(request: QueryMessagesRequest): Promise<QueryMessagesResponse>;
  /** Queries for a Contact item. */
  Contact(request: QueryContactRequest): Promise<QueryContactResponse>;
}

export class QueryClientImpl implements Query {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }
  Params(request: QueryParamsRequest): Promise<QueryParamsResponse> {
    const data = QueryParamsRequest.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Query", "Params", data);
    return promise.then((data) => QueryParamsResponse.decode(new Reader(data)));
  }

  Messages(request: QueryMessagesRequest): Promise<QueryMessagesResponse> {
    const data = QueryMessagesRequest.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Query", "Messages", data);
    return promise.then((data) =>
      QueryMessagesResponse.decode(new Reader(data))
    );
  }

  Contact(request: QueryContactRequest): Promise<QueryContactResponse> {
    const data = QueryContactRequest.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Query", "Contact", data);
    return promise.then((data) =>
      QueryContactResponse.decode(new Reader(data))
    );
  }
}

interface Rpc {
  request(
    service: string,
    method: string,
    data: Uint8Array
  ): Promise<Uint8Array>;
}

type Builtin = Date | Function | Uint8Array | string | number | undefined;
export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;
