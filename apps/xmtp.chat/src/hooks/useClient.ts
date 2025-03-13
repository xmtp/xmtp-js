import { Client, type ClientOptions, type Signer } from "@xmtp/browser-sdk";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { useCallback, useContext, useRef, useState } from "react";
import { XMTPContext } from "../contexts/XMTPContext";

export type InitializeClientOptions = {
  encryptionKey: Uint8Array;
  env?: ClientOptions["env"];
  loggingLevel?: ClientOptions["loggingLevel"];
  signer: Signer;
};

/**
 * This hook allows you to initialize, disconnect, and access the XMTP client
 * instance. It also exposes the error and initializing states of the client.
 */
export const useClient = (onError?: (error: Error) => void) => {
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // client is initializing
  const initializingRef = useRef(false);

  const { client, setClient } = useContext(XMTPContext);

  /**
   * Initialize an XMTP client
   */
  const initialize = useCallback(
    async ({
      encryptionKey,
      env,
      loggingLevel,
      signer,
    }: InitializeClientOptions) => {
      // only initialize a client if one doesn't already exist
      if (!client) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
          return undefined;
        }

        // flag the client as initializing
        initializingRef.current = true;

        // reset error state
        setError(null);
        // reset initializing state
        setInitializing(true);

        let xmtpClient: Client;

        try {
          // create a new XMTP client
          xmtpClient = await Client.create(signer, encryptionKey, {
            env,
            loggingLevel,
            codecs: [
              new ReactionCodec(),
              new ReplyCodec(),
              new RemoteAttachmentCodec(),
            ],
          });
          setClient(xmtpClient);
        } catch (e) {
          setClient(undefined);
          setError(e as Error);
          onError?.(e as Error);
          // re-throw error for upstream consumption
          throw e;
        } finally {
          initializingRef.current = false;
          setInitializing(false);
        }

        return xmtpClient;
      }
      return client;
    },
    [client, onError],
  );

  const disconnect = useCallback(() => {
    if (client) {
      client.close();
      setClient(undefined);
    }
  }, [client, setClient]);

  return {
    client,
    disconnect,
    error,
    initialize,
    initializing,
  };
};
