import { LogLevel } from "@xmtp/node-bindings";
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
   *
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
  it.skip("scenario 1", async () => {
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

    await dm.send("hi3"); // this message will not be received in the stream
    await dm.send("hi4");

    await sleep(1000);

    expect(messages.length).toEqual(4);
    expect(messages[2]).toEqual("hi3");
    expect(messages[3]).toEqual("hi4");

    await stream2.end();
  });

  /**
   * Scenario 2:
   *
   * - create agent and 2 client installations
   * - create dm between agent and client 1 (from client to agent)
   * - create stream to listen to all messages from agent
   * - send 2 messages from client 1 to agent
   * - verify 2 messages were received by agent
   * - sync client 2 conversations
   * - send 2 messages from client 2 to agent
   * - verify 2 messages were received by agent
   * - end stream
   */
  it("scenario 2", async () => {
    const agentUser = createUser();
    const clientUser = createUser();
    const agentSigner = createSigner(agentUser);
    const clientSigner = createSigner(clientUser);
    const agent = await createRegisteredClient(agentSigner);
    const client1 = await createRegisteredClient(clientSigner);
    // create new installation for client1
    const client2 = await createRegisteredClient(clientSigner, {
      dbPath: `./test-${v4()}.db3`,
    });
    const dm = await client1.conversations.newDm(agent.inboxId);

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

    await client2.conversations.sync();

    const dm2 = await client2.conversations.getConversationById(dm.id);

    expect(dm2?.id).toEqual(dm.id);

    await dm2?.send("hi3");
    await dm2?.send("hi4");

    await sleep(1000);

    expect(messages.length).toEqual(4);
    expect(messages[2]).toEqual("hi3");
    expect(messages[3]).toEqual("hi4");

    await stream.end();
  });

  /**
   * Scenario 3:
   *
   * - create agent and client
   * - create dm between agent and client (from client to agent)
   * - create stream to listen to all messages from agent
   * - send 2 messages from client to agent
   * - verify 2 messages were received by agent
   * - create new installation for client
   * - run sync all on agent and new client (required and order is important)
   * - send 2 messages from new client installation to agent
   * - verify 2 messages were received by agent
   */
  it("scenario 3", async () => {
    const agentUser = createUser();
    const clientUser = createUser();
    const agentSigner = createSigner(agentUser);
    const clientSigner = createSigner(clientUser);
    // const clientUser2 = createUser();
    // const clientSigner2 = createSigner(clientUser2);
    const agent = await createRegisteredClient(agentSigner, {
      loggingLevel: LogLevel.debug,
    });
    const client1 = await createRegisteredClient(clientSigner);
    const dm = await client1.conversations.newDm(agent.inboxId);

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

    // create new installation for client1
    const client2 = await createRegisteredClient(clientSigner, {
      dbPath: `./test-${v4()}.db3`,
    });

    // required, order is important
    await agent.conversations.syncAll();
    await client2.conversations.syncAll();

    const dm2 = await client2.conversations.newDm(agent.inboxId);

    expect(dm2.id).toEqual(dm.id); // fails without syncAll

    await dm2.send("hi3");
    await dm2.send("hi4");

    await sleep(1000);

    expect(messages.length).toEqual(4);
    expect(messages[2]).toEqual("hi3");
    expect(messages[3]).toEqual("hi4");

    await stream.end();
  });

  /**
   * Scenario 4:
   *
   * - create agent and client
   * - create dm between agent and client (from client to agent)
   * - create stream to listen to all messages from agent
   * - send 2 messages from client to agent
   * - verify 2 messages were received by agent
   * - end stream
   * - create new instance for agent (same installation)
   * - create stream to listen to all messages from new agent instance
   * - send 2 messages from client to agent
   * - verify 2 messages were received by new agent instance
   */
  it("scenario 4", async () => {
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

    // create new agent instance (same installation)
    const agent2 = await createRegisteredClient(agentSigner);

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
});
