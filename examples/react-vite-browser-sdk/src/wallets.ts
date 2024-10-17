import {
  createWalletClient,
  http,
  type PrivateKeyAccount,
  type Transport,
  type WalletClient,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const keys: Record<string, `0x${string}`> = {
  // address: 0xb879f1d8FD73EC057c02D681880169e5721a6d7F
  key1: "0xf8ced372cdb9a67bed1843650a89a59859369bf9900c0bc75741f2740e93cb04",
  // address: 0x7ad9d3892D5EEC0586920D3E0ac813aaeF881488
  key2: "0xb562d61bc9fe203a639dfc0c3f875b3411fe8ae211c5722ab9124a1009bda32a",
  // address: 0x73655B77df59d378d396918C3426cc5219EfB3c8
  key3: "0x724028dcbf931ff1f2730ad76c0b7b8b07dbf7f0a56408be3e305be1b81edfe0",
  // address: 0x5aB557A6b8FF7D7a9A42F223fAA376A4732Eb15a
  key4: "0x4420cde3d475a038739d1d47cfd690799c0f2e1b84d871c24f221c2dee4e4121",
  // address: 0x38F966794cf349f2c91116e94f587Fc3aafDC3F4
  key5: "0xd34cc37587785349013f3f10cadbe7bf8dfeb8a95c86724887e58816b734fcfb",
};

export const createWallet = (
  key: keyof typeof keys,
): WalletClient<Transport, typeof mainnet, PrivateKeyAccount> =>
  createWalletClient({
    account: privateKeyToAccount(keys[key] ?? generatePrivateKey()),
    chain: mainnet,
    transport: http(),
  });
