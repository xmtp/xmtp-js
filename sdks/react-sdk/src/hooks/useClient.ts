import { Client, type ClientOptions, type Signer } from "@xmtp/browser-sdk";
import { useCallback, useContext, useRef, useState } from "react";
import { XMTPClientContext } from "@/contexts/XMTPClient";

export const useClient = <ContentTypes = unknown>() => {
  const context = useContext(XMTPClientContext);
  const [client, setClient] = useState<Client<ContentTypes> | undefined>(
    undefined,
  );
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientPromiseRef = useRef<Promise<Client<ContentTypes>> | undefined>(
    undefined,
  );

  // use the client from the context if it's available
  const whichClient = (context?.client ?? client) as
    | Client<ContentTypes>
    | undefined;

  /**
   * Initialize an XMTP client
   */
  const initialize = useCallback(
    async (signer: Signer, options?: ClientOptions) => {
      // initialize a client if it doesn't already exist
      if (!whichClient) {
        // if the client is already initializing, return the client init promise
        if (clientPromiseRef.current) {
          return clientPromiseRef.current;
        }

        // start initializing the client
        clientPromiseRef.current = Client.create(signer, options) as Promise<
          Client<ContentTypes>
        >;

        // reset initializing and error state
        setInitializing(true);
        setError(null);

        let newClient: Client<ContentTypes>;

        try {
          // wait for the client to be initialized
          newClient = await clientPromiseRef.current;
          setClient(newClient);
        } catch (e) {
          setClient(undefined);
          setError(e as Error);
          // re-throw error for upstream consumption
          throw e;
        } finally {
          clientPromiseRef.current = undefined;
          setInitializing(false);
        }

        return newClient;
      }

      // return the existing client
      return whichClient;
    },
    [whichClient],
  );

  const disconnect = useCallback(() => {
    if (whichClient) {
      whichClient.close();
      setClient(undefined);
    }
  }, [whichClient, setClient]);

  return {
    client: whichClient,
    initialize: context?.initialize ?? initialize,
    initializing: context?.initializing ?? initializing,
    error: context?.error ?? error,
    disconnect: context?.disconnect ?? disconnect,
  };
};
