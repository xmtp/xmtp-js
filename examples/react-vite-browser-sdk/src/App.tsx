import {
  Conversation,
  type Client,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { createClient } from "./createClient";

export const App = () => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Map<string, DecodedMessage[]>>(
    new Map(),
  );

  const handleCreateClient = async () => {
    setClient(await createClient("key1"));
  };

  const handleResetClient = () => {
    if (client) {
      client.close();
    }
    setClient(undefined);
    setConversations([]);
    setMessages(new Map());
  };

  const handleListGroups = async () => {
    if (client) {
      const groups = await client.conversations.list();
      setConversations(groups);
    }
  };

  const handleUpdateGroupName = async (groupId: string, elementId: string) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      await conversation.sync();
      const element = document.getElementById(elementId) as HTMLInputElement;
      const name = element.value;
      await conversation.updateName(name);
      element.value = "";
      await handleListGroups();
    }
  };

  const handleUpdateGroupDescription = async (
    groupId: string,
    elementId: string,
  ) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      await conversation.sync();
      const element = document.getElementById(elementId) as HTMLInputElement;
      const description = element.value;
      await conversation.updateDescription(description);
      element.value = "";
      await handleListGroups();
    }
  };

  const handleListGroupMessages = async (groupId: string) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      await conversation.sync();
      const groupMessages = await conversation.messages();
      setMessages((prevMessages) => {
        const newMessages = new Map(prevMessages);
        newMessages.set(groupId, groupMessages);
        return newMessages;
      });
    }
  };

  const handleSendGroupMessage = async (groupId: string, elementId: string) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      await conversation.sync();
      const element = document.getElementById(elementId) as HTMLInputElement;
      const message = element.value;
      await conversation.send(message);
      element.value = "";
    }
  };

  const handleCreateGroup = async () => {
    if (client) {
      const element = document.getElementById(
        "create-group-name",
      ) as HTMLInputElement;
      const name = element.value;
      const group = await client.conversations.newGroup([]);
      await group.sync();
      await group.updateName(name);
      element.value = "";
      await handleListGroups();
    }
  };

  const handleSyncGroup = async (groupId: string) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      await conversation.sync();
      await handleListGroupMessages(groupId);
    }
  };

  return (
    <div className="App">
      <h1>XMTP V3</h1>
      <div className="Actions">
        {!client && (
          <button onClick={() => void handleCreateClient()} type="button">
            Create client
          </button>
        )}
        {client && (
          <>
            <button
              onClick={() => {
                handleResetClient();
              }}
              type="button">
              Reset client
            </button>
            <button onClick={() => void handleListGroups()} type="button">
              List groups
            </button>
          </>
        )}
      </div>
      {client && (
        <>
          <div className="Client">
            <h2>Client details</h2>
            <div className="ClientDetail">
              <div>Address:</div>
              <div>{client.address}</div>
            </div>
            <div className="ClientDetail">
              <div>Inbox ID:</div>
              <div>{client.inboxId}</div>
            </div>
            <div className="ClientDetail">
              <div>Installation ID:</div>
              <div>{client.installationId}</div>
            </div>
          </div>
          <div className="ConversationActions">
            <div className="ConversationAction">
              <input id="create-group-name" type="text" />
              <button onClick={() => void handleCreateGroup()} type="button">
                Create group
              </button>
            </div>
          </div>
        </>
      )}
      {conversations.length > 0 && (
        <div className="Conversations">
          <h2>Conversations</h2>
          <div className="ConversationWrapper">
            {conversations.map((conversation) => (
              <div className="Conversation" key={conversation.id}>
                <h3>{conversation.id}</h3>
                <div className="ConversationActions">
                  <div className="ConversationAction">
                    <input id={`group-name-${conversation.id}`} type="text" />
                    <button
                      onClick={() =>
                        void handleUpdateGroupName(
                          conversation.id,
                          `group-name-${conversation.id}`,
                        )
                      }
                      type="button">
                      Update group name
                    </button>
                  </div>
                  <div className="ConversationAction">
                    <input
                      id={`group-description-${conversation.id}`}
                      type="text"
                    />
                    <button
                      onClick={() =>
                        void handleUpdateGroupDescription(
                          conversation.id,
                          `group-description-${conversation.id}`,
                        )
                      }
                      type="button">
                      Update group description
                    </button>
                  </div>
                  <div className="ConversationAction">
                    <button
                      onClick={() => void handleSyncGroup(conversation.id)}
                      type="button">
                      Sync group
                    </button>
                    <button
                      onClick={() =>
                        void handleListGroupMessages(conversation.id)
                      }
                      type="button">
                      List messages
                    </button>
                  </div>
                  <div className="ConversationAction">
                    <input
                      id={`group-send-message-${conversation.id}`}
                      type="text"
                    />
                    <button
                      onClick={() =>
                        void handleSendGroupMessage(
                          conversation.id,
                          `group-send-message-${conversation.id}`,
                        )
                      }
                      type="button">
                      Send message
                    </button>
                  </div>
                </div>
                <div className="ConversationDetail">
                  <div>Name:</div>
                  <div>{conversation.name}</div>
                </div>
                <div className="ConversationDetail">
                  <div>Description:</div>
                  <div>{conversation.description}</div>
                </div>
                {messages.get(conversation.id) && (
                  <div className="ConversationMessages">
                    <h3>Messages</h3>
                    {messages.get(conversation.id)?.map((message) => (
                      <div className="ConversationMessage" key={message.id}>
                        <pre>{JSON.stringify(message.content, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
