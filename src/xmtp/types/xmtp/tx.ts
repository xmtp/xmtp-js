/* eslint-disable */
import { Reader, Writer } from "protobufjs/minimal";
import { Topic } from "../xmtp/topic";
import { Message } from "../xmtp/message";
import { Contact } from "../xmtp/contact";

export const protobufPackage = "xmtp.xmtp";

export interface Actor {
  account: string;
}

export interface MsgCreateTopic {
  actor: Actor | undefined;
  topic: Topic | undefined;
}

export interface MsgCreateTopicResponse {
  id: string;
}

export interface MsgUpdateTopic {
  actor: Actor | undefined;
  topic: Topic | undefined;
}

export interface MsgUpdateTopicResponse {
  id: string;
}

export interface MsgCreateMessage {
  actor: Actor | undefined;
  message: Message | undefined;
}

export interface MsgCreateMessageResponse {
  id: string;
}

export interface MsgUpdateMessage {
  actor: Actor | undefined;
  message: Message | undefined;
}

export interface MsgUpdateMessageResponse {
  id: string;
}

export interface MsgCreateContact {
  actor: Actor | undefined;
  contact: Contact | undefined;
}

export interface MsgCreateContactResponse {
  id: string;
}

const baseActor: object = { account: "" };

export const Actor = {
  encode(message: Actor, writer: Writer = Writer.create()): Writer {
    if (message.account !== "") {
      writer.uint32(10).string(message.account);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): Actor {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseActor } as Actor;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.account = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Actor {
    const message = { ...baseActor } as Actor;
    if (object.account !== undefined && object.account !== null) {
      message.account = String(object.account);
    } else {
      message.account = "";
    }
    return message;
  },

  toJSON(message: Actor): unknown {
    const obj: any = {};
    message.account !== undefined && (obj.account = message.account);
    return obj;
  },

  fromPartial(object: DeepPartial<Actor>): Actor {
    const message = { ...baseActor } as Actor;
    if (object.account !== undefined && object.account !== null) {
      message.account = object.account;
    } else {
      message.account = "";
    }
    return message;
  },
};

const baseMsgCreateTopic: object = {};

export const MsgCreateTopic = {
  encode(message: MsgCreateTopic, writer: Writer = Writer.create()): Writer {
    if (message.actor !== undefined) {
      Actor.encode(message.actor, writer.uint32(10).fork()).ldelim();
    }
    if (message.topic !== undefined) {
      Topic.encode(message.topic, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): MsgCreateTopic {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgCreateTopic } as MsgCreateTopic;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.actor = Actor.decode(reader, reader.uint32());
          break;
        case 2:
          message.topic = Topic.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgCreateTopic {
    const message = { ...baseMsgCreateTopic } as MsgCreateTopic;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromJSON(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = Topic.fromJSON(object.topic);
    } else {
      message.topic = undefined;
    }
    return message;
  },

  toJSON(message: MsgCreateTopic): unknown {
    const obj: any = {};
    message.actor !== undefined &&
      (obj.actor = message.actor ? Actor.toJSON(message.actor) : undefined);
    message.topic !== undefined &&
      (obj.topic = message.topic ? Topic.toJSON(message.topic) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<MsgCreateTopic>): MsgCreateTopic {
    const message = { ...baseMsgCreateTopic } as MsgCreateTopic;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromPartial(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = Topic.fromPartial(object.topic);
    } else {
      message.topic = undefined;
    }
    return message;
  },
};

const baseMsgCreateTopicResponse: object = { id: "" };

export const MsgCreateTopicResponse = {
  encode(
    message: MsgCreateTopicResponse,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): MsgCreateTopicResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgCreateTopicResponse } as MsgCreateTopicResponse;
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

  fromJSON(object: any): MsgCreateTopicResponse {
    const message = { ...baseMsgCreateTopicResponse } as MsgCreateTopicResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    return message;
  },

  toJSON(message: MsgCreateTopicResponse): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial(
    object: DeepPartial<MsgCreateTopicResponse>
  ): MsgCreateTopicResponse {
    const message = { ...baseMsgCreateTopicResponse } as MsgCreateTopicResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    return message;
  },
};

const baseMsgUpdateTopic: object = {};

export const MsgUpdateTopic = {
  encode(message: MsgUpdateTopic, writer: Writer = Writer.create()): Writer {
    if (message.actor !== undefined) {
      Actor.encode(message.actor, writer.uint32(10).fork()).ldelim();
    }
    if (message.topic !== undefined) {
      Topic.encode(message.topic, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): MsgUpdateTopic {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgUpdateTopic } as MsgUpdateTopic;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.actor = Actor.decode(reader, reader.uint32());
          break;
        case 2:
          message.topic = Topic.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgUpdateTopic {
    const message = { ...baseMsgUpdateTopic } as MsgUpdateTopic;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromJSON(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = Topic.fromJSON(object.topic);
    } else {
      message.topic = undefined;
    }
    return message;
  },

  toJSON(message: MsgUpdateTopic): unknown {
    const obj: any = {};
    message.actor !== undefined &&
      (obj.actor = message.actor ? Actor.toJSON(message.actor) : undefined);
    message.topic !== undefined &&
      (obj.topic = message.topic ? Topic.toJSON(message.topic) : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<MsgUpdateTopic>): MsgUpdateTopic {
    const message = { ...baseMsgUpdateTopic } as MsgUpdateTopic;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromPartial(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = Topic.fromPartial(object.topic);
    } else {
      message.topic = undefined;
    }
    return message;
  },
};

const baseMsgUpdateTopicResponse: object = { id: "" };

export const MsgUpdateTopicResponse = {
  encode(
    message: MsgUpdateTopicResponse,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): MsgUpdateTopicResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgUpdateTopicResponse } as MsgUpdateTopicResponse;
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

  fromJSON(object: any): MsgUpdateTopicResponse {
    const message = { ...baseMsgUpdateTopicResponse } as MsgUpdateTopicResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    return message;
  },

  toJSON(message: MsgUpdateTopicResponse): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial(
    object: DeepPartial<MsgUpdateTopicResponse>
  ): MsgUpdateTopicResponse {
    const message = { ...baseMsgUpdateTopicResponse } as MsgUpdateTopicResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    return message;
  },
};

const baseMsgCreateMessage: object = {};

export const MsgCreateMessage = {
  encode(message: MsgCreateMessage, writer: Writer = Writer.create()): Writer {
    if (message.actor !== undefined) {
      Actor.encode(message.actor, writer.uint32(10).fork()).ldelim();
    }
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): MsgCreateMessage {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgCreateMessage } as MsgCreateMessage;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.actor = Actor.decode(reader, reader.uint32());
          break;
        case 2:
          message.message = Message.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgCreateMessage {
    const message = { ...baseMsgCreateMessage } as MsgCreateMessage;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromJSON(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = Message.fromJSON(object.message);
    } else {
      message.message = undefined;
    }
    return message;
  },

  toJSON(message: MsgCreateMessage): unknown {
    const obj: any = {};
    message.actor !== undefined &&
      (obj.actor = message.actor ? Actor.toJSON(message.actor) : undefined);
    message.message !== undefined &&
      (obj.message = message.message
        ? Message.toJSON(message.message)
        : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<MsgCreateMessage>): MsgCreateMessage {
    const message = { ...baseMsgCreateMessage } as MsgCreateMessage;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromPartial(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = Message.fromPartial(object.message);
    } else {
      message.message = undefined;
    }
    return message;
  },
};

const baseMsgCreateMessageResponse: object = { id: "" };

export const MsgCreateMessageResponse = {
  encode(
    message: MsgCreateMessageResponse,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(
    input: Reader | Uint8Array,
    length?: number
  ): MsgCreateMessageResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseMsgCreateMessageResponse,
    } as MsgCreateMessageResponse;
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

  fromJSON(object: any): MsgCreateMessageResponse {
    const message = {
      ...baseMsgCreateMessageResponse,
    } as MsgCreateMessageResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    return message;
  },

  toJSON(message: MsgCreateMessageResponse): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial(
    object: DeepPartial<MsgCreateMessageResponse>
  ): MsgCreateMessageResponse {
    const message = {
      ...baseMsgCreateMessageResponse,
    } as MsgCreateMessageResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    return message;
  },
};

const baseMsgUpdateMessage: object = {};

export const MsgUpdateMessage = {
  encode(message: MsgUpdateMessage, writer: Writer = Writer.create()): Writer {
    if (message.actor !== undefined) {
      Actor.encode(message.actor, writer.uint32(10).fork()).ldelim();
    }
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): MsgUpdateMessage {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgUpdateMessage } as MsgUpdateMessage;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.actor = Actor.decode(reader, reader.uint32());
          break;
        case 2:
          message.message = Message.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgUpdateMessage {
    const message = { ...baseMsgUpdateMessage } as MsgUpdateMessage;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromJSON(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = Message.fromJSON(object.message);
    } else {
      message.message = undefined;
    }
    return message;
  },

  toJSON(message: MsgUpdateMessage): unknown {
    const obj: any = {};
    message.actor !== undefined &&
      (obj.actor = message.actor ? Actor.toJSON(message.actor) : undefined);
    message.message !== undefined &&
      (obj.message = message.message
        ? Message.toJSON(message.message)
        : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<MsgUpdateMessage>): MsgUpdateMessage {
    const message = { ...baseMsgUpdateMessage } as MsgUpdateMessage;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromPartial(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = Message.fromPartial(object.message);
    } else {
      message.message = undefined;
    }
    return message;
  },
};

const baseMsgUpdateMessageResponse: object = { id: "" };

export const MsgUpdateMessageResponse = {
  encode(
    message: MsgUpdateMessageResponse,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(
    input: Reader | Uint8Array,
    length?: number
  ): MsgUpdateMessageResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseMsgUpdateMessageResponse,
    } as MsgUpdateMessageResponse;
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

  fromJSON(object: any): MsgUpdateMessageResponse {
    const message = {
      ...baseMsgUpdateMessageResponse,
    } as MsgUpdateMessageResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    return message;
  },

  toJSON(message: MsgUpdateMessageResponse): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial(
    object: DeepPartial<MsgUpdateMessageResponse>
  ): MsgUpdateMessageResponse {
    const message = {
      ...baseMsgUpdateMessageResponse,
    } as MsgUpdateMessageResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    return message;
  },
};

const baseMsgCreateContact: object = {};

export const MsgCreateContact = {
  encode(message: MsgCreateContact, writer: Writer = Writer.create()): Writer {
    if (message.actor !== undefined) {
      Actor.encode(message.actor, writer.uint32(10).fork()).ldelim();
    }
    if (message.contact !== undefined) {
      Contact.encode(message.contact, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): MsgCreateContact {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseMsgCreateContact } as MsgCreateContact;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.actor = Actor.decode(reader, reader.uint32());
          break;
        case 2:
          message.contact = Contact.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MsgCreateContact {
    const message = { ...baseMsgCreateContact } as MsgCreateContact;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromJSON(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.contact !== undefined && object.contact !== null) {
      message.contact = Contact.fromJSON(object.contact);
    } else {
      message.contact = undefined;
    }
    return message;
  },

  toJSON(message: MsgCreateContact): unknown {
    const obj: any = {};
    message.actor !== undefined &&
      (obj.actor = message.actor ? Actor.toJSON(message.actor) : undefined);
    message.contact !== undefined &&
      (obj.contact = message.contact
        ? Contact.toJSON(message.contact)
        : undefined);
    return obj;
  },

  fromPartial(object: DeepPartial<MsgCreateContact>): MsgCreateContact {
    const message = { ...baseMsgCreateContact } as MsgCreateContact;
    if (object.actor !== undefined && object.actor !== null) {
      message.actor = Actor.fromPartial(object.actor);
    } else {
      message.actor = undefined;
    }
    if (object.contact !== undefined && object.contact !== null) {
      message.contact = Contact.fromPartial(object.contact);
    } else {
      message.contact = undefined;
    }
    return message;
  },
};

const baseMsgCreateContactResponse: object = { id: "" };

export const MsgCreateContactResponse = {
  encode(
    message: MsgCreateContactResponse,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(
    input: Reader | Uint8Array,
    length?: number
  ): MsgCreateContactResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = {
      ...baseMsgCreateContactResponse,
    } as MsgCreateContactResponse;
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

  fromJSON(object: any): MsgCreateContactResponse {
    const message = {
      ...baseMsgCreateContactResponse,
    } as MsgCreateContactResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    return message;
  },

  toJSON(message: MsgCreateContactResponse): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial(
    object: DeepPartial<MsgCreateContactResponse>
  ): MsgCreateContactResponse {
    const message = {
      ...baseMsgCreateContactResponse,
    } as MsgCreateContactResponse;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    return message;
  },
};

/** Msg defines the Msg service. */
export interface Msg {
  CreateTopic(request: MsgCreateTopic): Promise<MsgCreateTopicResponse>;
  UpdateTopic(request: MsgUpdateTopic): Promise<MsgUpdateTopicResponse>;
  CreateMessage(request: MsgCreateMessage): Promise<MsgCreateMessageResponse>;
  UpdateMessage(request: MsgUpdateMessage): Promise<MsgUpdateMessageResponse>;
  /** this line is used by starport scaffolding # proto/tx/rpc */
  CreateContact(request: MsgCreateContact): Promise<MsgCreateContactResponse>;
}

export class MsgClientImpl implements Msg {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
  }
  CreateTopic(request: MsgCreateTopic): Promise<MsgCreateTopicResponse> {
    const data = MsgCreateTopic.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Msg", "CreateTopic", data);
    return promise.then((data) =>
      MsgCreateTopicResponse.decode(new Reader(data))
    );
  }

  UpdateTopic(request: MsgUpdateTopic): Promise<MsgUpdateTopicResponse> {
    const data = MsgUpdateTopic.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Msg", "UpdateTopic", data);
    return promise.then((data) =>
      MsgUpdateTopicResponse.decode(new Reader(data))
    );
  }

  CreateMessage(request: MsgCreateMessage): Promise<MsgCreateMessageResponse> {
    const data = MsgCreateMessage.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Msg", "CreateMessage", data);
    return promise.then((data) =>
      MsgCreateMessageResponse.decode(new Reader(data))
    );
  }

  UpdateMessage(request: MsgUpdateMessage): Promise<MsgUpdateMessageResponse> {
    const data = MsgUpdateMessage.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Msg", "UpdateMessage", data);
    return promise.then((data) =>
      MsgUpdateMessageResponse.decode(new Reader(data))
    );
  }

  CreateContact(request: MsgCreateContact): Promise<MsgCreateContactResponse> {
    const data = MsgCreateContact.encode(request).finish();
    const promise = this.rpc.request("xmtp.xmtp.Msg", "CreateContact", data);
    return promise.then((data) =>
      MsgCreateContactResponse.decode(new Reader(data))
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
