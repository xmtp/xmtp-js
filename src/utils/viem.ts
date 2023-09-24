import type { WalletClient } from 'viem'
import { Signer } from '../types/Signer'
import { providers } from 'ethers'

export function getSigner(wallet: Signer | WalletClient | null): Signer | null {
  if (!wallet) {
    return null
  }
  if (isWalletClient(wallet)) {
    return convertWalletClientToSigner(wallet)
  }
  if (!(typeof wallet.getAddress !== 'function')) {
    throw new Error('Unknown wallet type')
  }
  return wallet
}

function isWalletClient(wallet: Signer | WalletClient): wallet is WalletClient {
  return 'type' in wallet && wallet.type === 'walletClient'
}

// Borrowed from https://wagmi.sh/react/ethers-adapters
export function convertWalletClientToSigner(
  walletClient: WalletClient
): Signer {
  const { account, chain, transport } = walletClient

  if (!account || !chain) {
    throw new Error('WalletClient is not configured')
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }

  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}
