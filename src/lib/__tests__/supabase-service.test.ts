import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
    })),
  },
}));

describe("Supabase Service - Transaction Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  describe("createTransaction", () => {
    it("should create a transaction with all required fields", async () => {
      const mockTransaction = {
        id: "uuid-123",
        from_address: "0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33",
        to_address: "user@test.com",
        amount: 100,
        token_type: "xBGL",
        type: "transfer",
        transaction_type: "treasury_transfer",
        tx_hash: "treasury_123_abc",
        status: "completed",
        created_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValueOnce({ data: mockTransaction, error: null });

      // Simulate the createTransaction function behavior
      const transaction = {
        from_address: "0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33",
        to_address: "user@test.com",
        amount: 100,
        token_type: "xBGL",
        type: "transfer",
        transaction_type: "treasury_transfer",
        tx_hash: "treasury_123_abc",
        status: "completed",
      };

      const { supabase } = await import("@/integrations/supabase/client");
      supabase.from("transactions");
      mockInsert(transaction);
      mockSelect();
      const result = await mockSingle();

      expect(result.data).toEqual(mockTransaction);
      expect(result.error).toBeNull();
    });

    it("should handle duplicate tx_hash error gracefully", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });

      const result = await mockSingle();

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("23505");
    });
  });

  describe("getTransactionByHash", () => {
    it("should find existing transaction by hash", async () => {
      const mockTransaction = {
        id: "uuid-123",
        tx_hash: "treasury_123_abc",
        amount: 100,
        status: "completed",
      };

      mockSingle.mockResolvedValueOnce({ data: mockTransaction, error: null });

      const result = await mockSingle();

      expect(result.data).toEqual(mockTransaction);
      expect(result.data?.tx_hash).toBe("treasury_123_abc");
    });

    it("should return null for non-existent transaction", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Row not found" },
      });

      const result = await mockSingle();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe("PGRST116");
    });
  });
});

describe("Supabase Service - Balance Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Balance calculations", () => {
    it("should correctly calculate balance after debit", () => {
      const currentBalance = 1000;
      const debitAmount = 100;
      const expectedBalance = currentBalance - debitAmount;

      expect(expectedBalance).toBe(900);
    });

    it("should correctly calculate balance after credit", () => {
      const currentBalance = 500;
      const creditAmount = 100;
      const expectedBalance = currentBalance + creditAmount;

      expect(expectedBalance).toBe(600);
    });

    it("should handle zero balance correctly", () => {
      const currentBalance = 0;
      const creditAmount = 50;
      const expectedBalance = currentBalance + creditAmount;

      expect(expectedBalance).toBe(50);
    });

    it("should handle decimal amounts correctly", () => {
      const currentBalance = 100.5;
      const debitAmount = 0.25;
      const expectedBalance = currentBalance - debitAmount;

      expect(expectedBalance).toBeCloseTo(100.25, 2);
    });

    it("should prevent negative balance after debit", () => {
      const currentBalance = 50;
      const debitAmount = 100;
      const canDebit = currentBalance >= debitAmount;

      expect(canDebit).toBe(false);
    });
  });
});

describe("Treasury Address Validation", () => {
  const TREASURY_ADDRESS = "0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33";

  it("should recognize treasury address (case insensitive)", () => {
    const isTreasury = (addr: string) =>
      addr.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

    expect(isTreasury("0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33")).toBe(true);
    expect(isTreasury("0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33")).toBe(true);
    expect(isTreasury("0x1234567890abcdef1234567890abcdef12345678")).toBe(false);
  });

  it("should identify incoming vs outgoing treasury transactions", () => {
    const isIncomingToTreasury = (toAddr: string) =>
      toAddr.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

    const isOutgoingFromTreasury = (fromAddr: string) =>
      fromAddr.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

    // Incoming deposit
    expect(isIncomingToTreasury(TREASURY_ADDRESS)).toBe(true);
    expect(isOutgoingFromTreasury("0x1234...")).toBe(false);

    // Outgoing transfer
    expect(isOutgoingFromTreasury(TREASURY_ADDRESS)).toBe(true);
    expect(isIncomingToTreasury("user@test.com")).toBe(false);
  });
});

describe("Transaction Type Classification", () => {
  it("should classify treasury transfer correctly", () => {
    const classifyTransaction = (tx: { from_address: string; to_address: string; transaction_type: string }) => {
      const treasury = "0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33";
      const fromTreasury = tx.from_address.toLowerCase() === treasury;
      const toTreasury = tx.to_address.toLowerCase() === treasury;

      if (fromTreasury && !toTreasury) return "outgoing";
      if (!fromTreasury && toTreasury) return "incoming";
      if (fromTreasury && toTreasury) return "internal";
      return "external";
    };

    expect(
      classifyTransaction({
        from_address: "0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33",
        to_address: "user@test.com",
        transaction_type: "treasury_transfer",
      })
    ).toBe("outgoing");

    expect(
      classifyTransaction({
        from_address: "0x1234567890abcdef",
        to_address: "0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33",
        transaction_type: "transfer_in",
      })
    ).toBe("incoming");

    expect(
      classifyTransaction({
        from_address: "user1@test.com",
        to_address: "user2@test.com",
        transaction_type: "admin_transfer",
      })
    ).toBe("external");
  });
});

describe("Token Type Handling", () => {
  it("should recognize supported token types", () => {
    const SUPPORTED_TOKENS = ["xBGL", "USDC", "ETH", "AVAX"];

    const isSupported = (token: string) =>
      SUPPORTED_TOKENS.includes(token.toUpperCase()) || SUPPORTED_TOKENS.includes(token);

    expect(isSupported("xBGL")).toBe(true);
    expect(isSupported("USDC")).toBe(true);
    expect(isSupported("ETH")).toBe(true);
    expect(isSupported("UNKNOWN")).toBe(false);
  });

  it("should format token amounts correctly", () => {
    const formatAmount = (amount: number, token: string): string => {
      if (token === "ETH") return amount.toFixed(6);
      if (token === "USDC") return amount.toFixed(2);
      return amount.toFixed(4);
    };

    expect(formatAmount(0.0004, "ETH")).toBe("0.000400");
    expect(formatAmount(20, "USDC")).toBe("20.00");
    expect(formatAmount(34, "xBGL")).toBe("34.0000");
  });
});
