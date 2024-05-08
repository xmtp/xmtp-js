import type { MetaMaskInpageProvider } from '@metamask/providers'

type EthereumType = MetaMaskInpageProvider & {
  setProvider?: (provider: MetaMaskInpageProvider) => void
  detected?: MetaMaskInpageProvider[]
  providers?: MetaMaskInpageProvider[]
}

/*
 * Window type extension to support ethereum
 */
declare global {
  interface Window {
    ethereum: EthereumType
  }

  interface globalThis {
    ethereum: EthereumType
  }
}
