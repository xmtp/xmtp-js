import {
  Client,
  type ClientOptions,
  type ExtractCodecContentTypes,
  type Identifier,
  type Signer,
} from "@xmtp/browser-sdk";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import { useCallback, useRef, useState } from "react";
import { useClientContext } from "@/contexts/Client";

export const useClient = <ContentCodecs extends ContentCodec[] = []>() => {
  type ContentTypes = ExtractCodecContentTypes<ContentCodecs>;
  const context = useClientContext<ContentTypes>();
  const [client, setClient] = useState<Client<ContentTypes> | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const createClientPromiseRef = useRef<
    Promise<Client<ContentTypes>> | undefined
  >(undefined);

  // use the client from the context if it's available
  const whichClient = context?.client ?? client;

  // initialize a client with the provided function
  const init = useCallback(
    async (createClient: () => Promise<Client<ContentTypes>>) => {
      // if the client is already initializing, return the client init promise
      if (createClientPromiseRef.current) {
        return createClientPromiseRef.current;
      }

      // start initializing the client
      createClientPromiseRef.current = createClient();

      setLoading(true);
      setError(null);

      let newClient: Client<ContentTypes>;

      try {
        // wait for the client to be initialized
        newClient = await createClientPromiseRef.current;
        context?.setClient(newClient);
        setClient(newClient);
      } catch (e) {
        setError(e as Error);
        // re-throw error for upstream consumption
        throw e;
      } finally {
        createClientPromiseRef.current = undefined;
        setLoading(false);
      }

      return newClient;
    },
    [],
  );

  const build = useCallback(
    async (
      identifier: Identifier,
      options?: Omit<ClientOptions, "codecs"> & {
        codecs?: ContentCodecs;
      },
    ) => {
      return init(() => Client.build(identifier, options));
    },
    [],
  );

  const create = useCallback(
    async (
      signer: Signer,
      options?: Omit<ClientOptions, "codecs"> & {
        codecs?: ContentCodecs;
      },
    ) => {
      return init(() => Client.create(signer, options));
    },
    [],
  );

  const register = useCallback(async () => {
    if (whichClient) {
      await whichClient.register();
    }
  }, [whichClient]);

  const disconnect = useCallback(() => {
    if (whichClient) {
      whichClient.close();
      context?.setClient(undefined);
      setClient(undefined);
    }
  }, [whichClient, context]);

  return {
    build,
    client: whichClient,
    create,
    disconnect,
    error,
    loading,
    register,
  };
};
