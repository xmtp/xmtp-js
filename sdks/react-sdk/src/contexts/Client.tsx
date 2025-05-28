import type { Client } from "@xmtp/browser-sdk";
import { createContext, useContext, useMemo, useState } from "react";

export type SetClient<ContentTypes = unknown> = React.Dispatch<
  React.SetStateAction<Client<ContentTypes> | undefined>
>;

export type ClientContextValue =
  | undefined
  | {
      client?: Client;
      setClient: SetClient;
    };

export const ClientContext = createContext<ClientContextValue>(undefined);

export const ClientProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [client, setClient] = useState<Client | undefined>(undefined);

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      setClient,
    }),
    [client],
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};

export const useClientContext = <ContentTypes = unknown,>() => {
  const context = useContext(ClientContext);
  return context !== undefined
    ? {
        client: context.client as Client<ContentTypes> | undefined,
        setClient: context.setClient as SetClient<ContentTypes>,
      }
    : undefined;
};
