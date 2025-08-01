import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import type { DecodedMessage } from "@/DecodedMessage";
import {
  createRegisteredClient,
  createSigner,
  createUser,
  sleep,
} from "@test/helpers";

describe("message streaming", () => {
  /**
   * Scenario 1:
   * - create agent and client
   * - create dm between agent and client (from client to agent)
   * - create stream to listen to all messages from agent
   * - send 2 messages from client to agent
   * - verify 2 messages were received by agent
   * - end stream
   * - create new installation for agent
   * - sync all between agent installations (first agent, then new agent)
   * - create stream to listen to all messages from new agent installation
   * - send 2 messages from client to agent
   * - verify 2 messages were received by new agent installation
   */
  it("scenario 1", async () => {
    const agentUser = createUser();
    const clientUser = createUser();
    const agentSigner = createSigner(agentUser);
    const clientSigner = createSigner(clientUser);
    const agent = await createRegisteredClient(agentSigner);
    const client = await createRegisteredClient(clientSigner);
    const dm = await client.conversations.newDm(agent.inboxId);

    const messages: string[] = [];
    const onValue = (message: DecodedMessage) => {
      messages.push(message.content as string);
    };

    await sleep(2000);

    const stream1 = await agent.conversations.streamAllMessages({ onValue });

    await dm.send("hi1");
    await dm.send("hi2");

    await sleep(1000);

    expect(messages.length).toEqual(2);
    expect(messages[0]).toEqual("hi1");
    expect(messages[1]).toEqual("hi2");

    await stream1.end();

    // create new installation for agent
    const agent2 = await createRegisteredClient(agentSigner, {
      dbPath: `./test-${v4()}.db3`,
    });
    await agent.conversations.syncAll();
    await agent2.conversations.syncAll();

    await sleep(2000);

    const stream2 = await agent2.conversations.streamAllMessages({ onValue });

    await dm.send("hi3");
    await dm.send("hi4");

    await sleep(1000);

    expect(messages.length).toEqual(4);
    expect(messages[2]).toEqual("hi3");
    expect(messages[3]).toEqual("hi4");

    await stream2.end();
  });

  /**
   * Scenario 2:
   * - create agent and client
   * - create dm between agent and client (from client to agent)
   * - create stream to listen to all messages from agent
   * - send 2 messages from client to agent
   * - verify 2 messages were received by agent
   * - create new installation for client
   */
  it("scenario 2", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const agent = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    // create new installation for client2
    const client3 = await createRegisteredClient(signer2, {
      dbPath: `./test-${v4()}.db3`,
    });
    const dm = await client2.conversations.newDm(agent.inboxId);

    await agent.conversations.sync();
    await client2.conversations.sync();
    await client3.conversations.sync();

    const messages: string[] = [];
    const onValue = (message: DecodedMessage) => {
      messages.push(message.content as string);
    };

    await sleep(2000);

    const stream = await agent.conversations.streamAllMessages({ onValue });

    await dm.send("hi1");
    await dm.send("hi2");

    await sleep(1000);

    expect(messages.length).toEqual(2);
    expect(messages[0]).toEqual("hi1");
    expect(messages[1]).toEqual("hi2");

    await client2.conversations.syncAll();
    await client3.conversations.syncAll();

    const dm2 = await client3.conversations.getConversationById(dm.id);

    expect(dm2?.id).toEqual(dm.id);

    await dm2?.send("hi3");
    await dm2?.send("hi4");

    await sleep(1000);

    expect(messages.length).toEqual(4);
    expect(messages[2]).toEqual("hi3");
    expect(messages[3]).toEqual("hi4");

    await stream.end();
  });

  it("scenario 3", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const agent = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client2.conversations.newDm(agent.inboxId);

    const messages: string[] = [];
    const onValue = (message: DecodedMessage) => {
      messages.push(message.content as string);
    };

    await sleep(2000);

    const stream = await agent.conversations.streamAllMessages({ onValue });

    await dm.send("hi1");
    await dm.send("hi2");

    await sleep(1000);

    expect(messages.length).toEqual(2);
    expect(messages[0]).toEqual("hi1");
    expect(messages[1]).toEqual("hi2");

    // create new installation for client2
    const client3 = await createRegisteredClient(signer2, {
      dbPath: `./test-${v4()}.db3`,
    });

    // required, order is important
    await agent.conversations.syncAll();
    await client3.conversations.syncAll();

    await sleep(2000);

    const dm2 = await client3.conversations.newDm(agent.inboxId);

    expect(dm2.id).toEqual(dm.id);

    await dm2.send("hi3");
    await dm2.send("hi4");

    await sleep(1000);

    expect(messages.length).toEqual(4);
    expect(messages[2]).toEqual("hi3");
    expect(messages[3]).toEqual("hi4");

    await stream.end();
  });
});
