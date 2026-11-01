import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RunANodeApprove from "../RunANodeApprove";

const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const CHALLENGE_ID = "00000000-0000-4000-8000-000000000099";

function localhostJoinMessage(extraResource?: string) {
  const resources = ["- urn:octa:purpose:join", "- urn:octa:platform:desktop", "- urn:octa:env:dev"];
  if (extraResource) resources.push(`- ${extraResource}`);
  return `localhost wants you to sign in with your Ethereum account:
${TEST_ADDRESS}

Octa Personal Node Join Request

URI: http://localhost:8080
Version: 1
Chain ID: 43113
Nonce: 0123456789abcdef0123456789abcdef
Issued At: 2026-06-01T12:00:00.000Z
Expiration Time: 2026-06-01T12:10:00.000Z
Resources:
${resources.join("\n")}`;
}

const mockConnect = vi.fn();
const mockPersonalSign = vi.fn();
const mockEnsureChain = vi.fn();

vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => ({
    address: TEST_ADDRESS,
    isConnected: true,
    provider: { request: mockPersonalSign },
    connect: mockConnect,
  }),
}));

vi.mock("@/components/WalletConnectButton", () => ({
  WalletConnectButton: () => <button type="button">Wallet</button>,
}));

vi.mock("@/lib/node-approve-wallet", () => ({
  personalSignRawMessage: (...args: unknown[]) => mockPersonalSign(...args),
  ensureWalletChain: (...args: unknown[]) => mockEnsureChain(...args),
  resolveWalletProvider: () => ({ request: mockPersonalSign }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

function publicPayload(overrides: Record<string, unknown> = {}) {
  const expires = new Date(Date.now() + 600_000).toISOString();
  return {
    success: true,
    state: "pending",
    domain: "localhost",
    chain_id: "43113",
    address: TEST_ADDRESS,
    uri: "http://localhost:8080",
    issued_at: new Date().toISOString(),
    expiration_time: expires,
    platform: "desktop",
    app_version: "1.0.0",
    device_pubkey: "0xabc0000000000000000000000000000000000001",
    resources: ["urn:octa:purpose:join"],
    message: localhostJoinMessage(),
    nonce: "0123456789abcdef0123456789abcdef",
    purpose: "join",
    expires_at: expires,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/run-a-node/approve?challenge=${CHALLENGE_ID}`]}>
      <Routes>
        <Route path="/run-a-node/approve" element={<RunANodeApprove />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RunANodeApprove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureChain.mockResolvedValue(true);
    mockPersonalSign.mockResolvedValue("0xsig");
    Object.defineProperty(window, "location", {
      value: { host: "localhost", origin: "http://localhost:8080" },
      writable: true,
    });
  });

  it("shows expired terminal when public state is expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => publicPayload({ state: "expired" }),
      }),
    );

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Request expired/i)).toBeInTheDocument();
    });
  });

  it("shows already used terminal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => publicPayload({ state: "already_used" }),
      }),
    );

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Already handled/i)).toBeInTheDocument();
    });
  });

  it("handles device_limit_reached then replace and second sign", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    let signCalls = 0;

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/public")) {
        return { ok: true, json: async () => publicPayload({ domain: "localhost" }) };
      }
      if (url.includes("/sign") && init?.method === "POST") {
        signCalls += 1;
        if (signCalls === 1) {
          return {
            ok: false,
            status: 409,
            json: async () => ({
              success: false,
              error: "device_limit_reached",
              nodes: [
                {
                  id: "node-a",
                  platform: "android",
                  app_version: "1.0.0",
                  last_seen_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  status: "approved",
                  label: null,
                },
              ],
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({ success: true, state: "signed", node_id: "new-node" }),
        };
      }
      if (url.includes("/replace")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            challenge_id: CHALLENGE_ID,
            message: localhostJoinMessage("urn:octa:replace:node-a"),
            expires_at: new Date(Date.now() + 600_000).toISOString(),
            replace_node_id: "node-a",
            state: "pending",
          }),
        };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Approve this device/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign and approve device/i }));

    await waitFor(() => {
      expect(screen.getByText(/Device limit reached/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("radio"));
    fireEvent.click(screen.getByRole("button", { name: /Replace selected device/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sign the updated message/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign and approve device/i }));

    await waitFor(() => {
      expect(screen.getByText(/Device approved/i)).toBeInTheDocument();
    });
  });
});
