import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";

const mockResetPasswordForEmail = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
    },
  },
}));

vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => ({
    address: null,
    isConnected: false,
  }),
}));

vi.mock("@/components/WalletConnectButton", () => ({
  WalletConnectButton: () => <button type="button">Connect Wallet</button>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Login auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });
    mockSignUp.mockResolvedValue({ data: {}, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("sends forgot password email", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "user@test.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Forgot Password\?/i }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalled();
    });
  });

});
