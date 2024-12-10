import type { Client } from "@xmtp/browser-sdk";
import { createContext, useMemo, useState } from "react";

export type XMTPContextValue = {
  /**
   * The XMTP client instance
   */
  client?: Client;
  /**
   * Set the XMTP client instance
   */
  setClient: React.Dispatch<React.SetStateAction<Client | undefined>>;
};

export const XMTPContext = createContext<XMTPContextValue>({
  setClient: () => {},
});

export type XMTPProviderProps = React.PropsWithChildren & {
  /**
   * Initial XMTP client instance
   */
  client?: Client;
};

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  children,
  client: initialClient,
}) => {
  const [client, setClient] = useState<Client | undefined>(initialClient);

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      setClient,
    }),
    [client],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};
