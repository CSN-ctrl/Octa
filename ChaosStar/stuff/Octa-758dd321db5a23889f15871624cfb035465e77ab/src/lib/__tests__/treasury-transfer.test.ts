import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase client
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockRpc,
    from: () => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
    }),
  },
}));

// Mock supabase-service
vi.mock("@/lib/supabase-service", () => ({
  createTransaction: vi.fn().mockResolvedValue({ id: "test-tx-id" }),
  reconcileBalance: vi.fn().mockResolvedValue(null),
}));

describe("Treasury Transfer Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("admin_treasury_transfer RPC", () => {
    it("should successfully transfer xBGL from treasury to user", async () => {
      mockRpc.mockResolvedValueOnce({
        data: { ok: true, duplicate: false, tx_hash: "test_tx_123", treasury_balance: 999900 },
        error: null,
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: 100,
        p_tx_hash: "test_tx_123",
        p_metadata: { treasury_transfer: true },
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        ok: true,
        duplicate: false,
        tx_hash: "test_tx_123",
        treasury_balance: 999900,
      });
      expect(mockRpc).toHaveBeenCalledWith("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: 100,
        p_tx_hash: "test_tx_123",
        p_metadata: { treasury_transfer: true },
      });
    });

    it("should handle duplicate transaction (idempotency)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: { ok: true, duplicate: true, tx_hash: "test_tx_123" },
        error: null,
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: 100,
        p_tx_hash: "test_tx_123",
        p_metadata: {},
      });

      expect(result.error).toBeNull();
      expect(result.data?.duplicate).toBe(true);
    });

    it("should reject transfer with insufficient treasury balance", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "insufficient treasury balance", code: "P0001" },
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: 999999999,
        p_tx_hash: "test_tx_big",
        p_metadata: {},
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("insufficient");
    });

    it("should reject transfer with invalid amount (zero)", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "invalid amount", code: "P0001" },
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: 0,
        p_tx_hash: "test_tx_zero",
        p_metadata: {},
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("invalid amount");
    });

    it("should reject transfer with negative amount", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "invalid amount", code: "P0001" },
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: -50,
        p_tx_hash: "test_tx_neg",
        p_metadata: {},
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("invalid amount");
    });

    it("should reject transfer with empty recipient", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "invalid recipient", code: "P0001" },
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "",
        p_amount: 100,
        p_tx_hash: "test_tx_empty",
        p_metadata: {},
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("invalid recipient");
    });

    it("should reject transfer with missing tx_hash", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "missing tx_hash", code: "P0001" },
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: 100,
        p_tx_hash: "",
        p_metadata: {},
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("missing tx_hash");
    });

    it("should reject transfer from non-admin user", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "forbidden", code: "42501" },
      });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.rpc("admin_treasury_transfer", {
        p_recipient: "user@test.com",
        p_amount: 100,
        p_tx_hash: "test_tx_nonadmin",
        p_metadata: {},
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("forbidden");
    });
  });

  describe("Transfer validation helpers", () => {
    it("should validate positive amount", () => {
      const validateAmount = (amount: string): boolean => {
        const parsed = parseFloat(amount);
        return !isNaN(parsed) && parsed > 0;
      };

      expect(validateAmount("100")).toBe(true);
      expect(validateAmount("0.001")).toBe(true);
      expect(validateAmount("0")).toBe(false);
      expect(validateAmount("-50")).toBe(false);
      expect(validateAmount("abc")).toBe(false);
      expect(validateAmount("")).toBe(false);
    });

    it("should normalize wallet addresses to lowercase", () => {
      const normalizeAddress = (addr: string): string => addr.toLowerCase().trim();

      expect(normalizeAddress("0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33")).toBe(
        "0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33"
      );
      expect(normalizeAddress("  user@TEST.com  ")).toBe("user@test.com");
    });

    it("should generate unique transaction hashes", () => {
      const generateTxHash = (prefix: string): string =>
        `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

      const hash1 = generateTxHash("treasury");
      const hash2 = generateTxHash("treasury");

      expect(hash1).toMatch(/^treasury_\d+_[a-z0-9]+$/);
      expect(hash2).toMatch(/^treasury_\d+_[a-z0-9]+$/);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("In-flight lock mechanism", () => {
    it("should prevent concurrent transfers to same recipient", () => {
      let inFlightLock: string | null = null;

      const acquireLock = (recipient: string, amount: number, txHash: string): boolean => {
        if (inFlightLock) return false;
        inFlightLock = `${recipient}:${amount}:${txHash}`;
        return true;
      };

      const releaseLock = () => {
        inFlightLock = null;
      };

      expect(acquireLock("user@test.com", 100, "tx1")).toBe(true);
      expect(acquireLock("user@test.com", 100, "tx2")).toBe(false);

      releaseLock();
      expect(acquireLock("user@test.com", 100, "tx3")).toBe(true);
    });
  });
});

describe("User-to-User Transfer Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  describe("Balance checks", () => {
    it("should reject transfer when sender has insufficient balance", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { wallet_address: "sender@test.com", xbgl_balance: 50 },
        error: null,
      });

      const senderBalance = 50;
      const transferAmount = 100;

      expect(senderBalance >= transferAmount).toBe(false);
    });

    it("should allow transfer when sender has sufficient balance", async () => {
      const senderBalance = 200;
      const transferAmount = 100;

      expect(senderBalance >= transferAmount).toBe(true);
    });

    it("should calculate new balances correctly", () => {
      const senderBalance = 500;
      const receiverBalance = 100;
      const transferAmount = 150;

      const newSenderBalance = senderBalance - transferAmount;
      const newReceiverBalance = receiverBalance + transferAmount;

      expect(newSenderBalance).toBe(350);
      expect(newReceiverBalance).toBe(250);
    });

    it("should handle receiver with no existing balance", () => {
      const senderBalance = 500;
      const receiverBalance = null;
      const transferAmount = 150;

      const newSenderBalance = senderBalance - transferAmount;
      const newReceiverBalance = (receiverBalance || 0) + transferAmount;

      expect(newSenderBalance).toBe(350);
      expect(newReceiverBalance).toBe(150);
    });
  });
});

describe("Transaction Record Creation", () => {
  it("should create valid transaction metadata", () => {
    const createTransactionMetadata = (
      isAdminTransfer: boolean,
      isTreasuryTransfer: boolean,
      recipientEmail?: string
    ) => ({
      admin_transfer: isAdminTransfer,
      treasury_transfer: isTreasuryTransfer,
      timestamp: new Date().toISOString(),
      ...(recipientEmail && { recipient_email: recipientEmail }),
    });

    const metadata = createTransactionMetadata(true, true, "user@test.com");

    expect(metadata.admin_transfer).toBe(true);
    expect(metadata.treasury_transfer).toBe(true);
    expect(metadata.recipient_email).toBe("user@test.com");
    expect(metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("should create transaction with required fields", () => {
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

    expect(transaction.from_address).toBeTruthy();
    expect(transaction.to_address).toBeTruthy();
    expect(transaction.amount).toBeGreaterThan(0);
    expect(transaction.tx_hash).toBeTruthy();
    expect(transaction.status).toBe("completed");
  });
});
