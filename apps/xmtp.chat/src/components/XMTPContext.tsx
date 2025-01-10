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
  /**
   * Set whether to show confetti
   */
  setConfetti: React.Dispatch<React.SetStateAction<boolean>>;
};

export const XMTPContext = createContext<XMTPContextValue>({
  setClient: () => {},
  setConfetti: () => {},
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
  const [confetti, setConfetti] = useState(false);

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      setClient,
      confetti,
      setConfetti,
    }),
    [client, confetti],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};
