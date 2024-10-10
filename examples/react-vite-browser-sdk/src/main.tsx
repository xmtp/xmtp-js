import "./polyfills";
import "@rainbow-me/rainbowkit/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "@wagmi/core/chains";
import { http } from "@wagmi/core";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import "./index.css";

export const config = getDefaultConfig({
  appName: "XMTP V3 Browser SDK Example",
  projectId: import.meta.env.VITE_PROJECT_ID,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root") as HTMLElement).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <StrictMode>
          <App />
        </StrictMode>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>,
);
