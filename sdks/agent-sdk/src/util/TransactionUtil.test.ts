import { toHex } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createERC20TransferCalls,
  createNativeTransferCalls,
  erc20Abi,
  getERC20Balance,
  getERC20Decimals,
} from "@/util/TransactionUtil";

const mockReadContract = vi.fn();

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: mockReadContract,
    })),
  };
});

const testChain = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
} as const;

const testTokenAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const testFrom = "0x1234567890abcdef1234567890abcdef12345678" as const;
const testTo = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as const;

describe("TransactionUtil", () => {
  beforeEach(() => {
    mockReadContract.mockReset();
  });

  describe("erc20Abi", () => {
    it("contains transfer, balanceOf, and decimals", () => {
      expect(erc20Abi).toHaveLength(3);
      const names = erc20Abi.map((entry) => entry.name);
      expect(names).toContain("transfer");
      expect(names).toContain("balanceOf");
      expect(names).toContain("decimals");
    });
  });

  describe("createERC20TransferCalls", () => {
    it("returns a valid WalletSendCalls object", () => {
      const result = createERC20TransferCalls({
        chain: testChain,
        tokenAddress: testTokenAddress,
        from: testFrom,
        to: testTo,
        amount: 1_000_000n,
      });

      expect(result.version).toBe("1.0");
      expect(result.chainId).toBe(toHex(testChain.id));
      expect(result.from).toBe(testFrom);
      expect(result.calls).toHaveLength(1);

      const call = result.calls[0]!;
      expect(call.to).toBe(testTokenAddress);
      expect(call.value).toBe("0x0");
    });

    it("encodes transfer data correctly", () => {
      const result = createERC20TransferCalls({
        chain: testChain,
        tokenAddress: testTokenAddress,
        from: testFrom,
        to: testTo,
        amount: 1_000_000n,
      });

      const call = result.calls[0]!;
      // ERC-20 transfer function selector
      expect(call.data).toMatch(/^0xa9059cbb/);
    });

    it("uses default metadata when none provided", () => {
      const result = createERC20TransferCalls({
        chain: testChain,
        tokenAddress: testTokenAddress,
        from: testFrom,
        to: testTo,
        amount: 1_000_000n,
      });

      const call = result.calls[0]!;
      expect(call.metadata).toEqual({
        description: "ERC-20 token transfer",
        transactionType: "transfer",
      });
    });

    it("uses custom metadata when provided", () => {
      const customMetadata = {
        description: "Send 1 USDC",
        transactionType: "transfer",
        currency: "USDC",
      };

      const result = createERC20TransferCalls({
        chain: testChain,
        tokenAddress: testTokenAddress,
        from: testFrom,
        to: testTo,
        amount: 1_000_000n,
        metadata: customMetadata,
      });

      const call = result.calls[0]!;
      expect(call.metadata).toEqual(customMetadata);
    });

    it("converts chain ID to hex", () => {
      const result = createERC20TransferCalls({
        chain: { ...testChain, id: 8453 },
        tokenAddress: testTokenAddress,
        from: testFrom,
        to: testTo,
        amount: 1n,
      });

      expect(result.chainId).toBe(toHex(8453));
    });
  });

  describe("createNativeTransferCalls", () => {
    it("returns a valid WalletSendCalls object", () => {
      const amount = 1_000_000_000_000_000_000n; // 1 ETH in wei

      const result = createNativeTransferCalls({
        chain: testChain,
        from: testFrom,
        to: testTo,
        amount,
      });

      expect(result.version).toBe("1.0");
      expect(result.chainId).toBe(toHex(testChain.id));
      expect(result.from).toBe(testFrom);
      expect(result.calls).toHaveLength(1);

      const call = result.calls[0]!;
      expect(call.to).toBe(testTo);
      expect(call.value).toBe(toHex(amount));
    });

    it("does not set data field", () => {
      const result = createNativeTransferCalls({
        chain: testChain,
        from: testFrom,
        to: testTo,
        amount: 1n,
      });

      const call = result.calls[0]!;
      expect(call.data).toBeUndefined();
    });

    it("uses default metadata when none provided", () => {
      const result = createNativeTransferCalls({
        chain: testChain,
        from: testFrom,
        to: testTo,
        amount: 1n,
      });

      const call = result.calls[0]!;
      expect(call.metadata).toEqual({
        description: "Native token transfer",
        transactionType: "transfer",
      });
    });

    it("uses custom metadata when provided", () => {
      const customMetadata = {
        description: "Send 0.5 ETH",
        transactionType: "transfer",
      };

      const result = createNativeTransferCalls({
        chain: testChain,
        from: testFrom,
        to: testTo,
        amount: 500_000_000_000_000_000n,
        metadata: customMetadata,
      });

      const call = result.calls[0]!;
      expect(call.metadata).toEqual(customMetadata);
    });
  });

  describe("getERC20Balance", () => {
    it("reads balance from the chain", async () => {
      const expectedBalance = 5_000_000n;
      mockReadContract.mockResolvedValue(expectedBalance);

      const balance = await getERC20Balance({
        chain: testChain,
        tokenAddress: testTokenAddress,
        address: testFrom,
      });

      expect(balance).toBe(expectedBalance);
      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: testTokenAddress,
          functionName: "balanceOf",
          args: [testFrom],
        }),
      );
    });
  });

  describe("getERC20Decimals", () => {
    it("reads decimals from the chain", async () => {
      const expectedDecimals = 6;
      mockReadContract.mockResolvedValue(expectedDecimals);

      const decimals = await getERC20Decimals({
        chain: testChain,
        tokenAddress: testTokenAddress,
      });

      expect(decimals).toBe(expectedDecimals);
      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: testTokenAddress,
          functionName: "decimals",
        }),
      );
    });
  });
});
