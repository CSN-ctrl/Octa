import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "../ResetPassword";

const mockGetSession = vi.fn();
const mockUpdateUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockExchangeCodeForSession = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      exchangeCodeForSession: (...args: any[]) => mockExchangeCodeForSession(...args),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "1" } } } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("updates password for recovery session", async () => {
    window.location.hash = "#type=recovery";
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: "StrongPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: "StrongPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "StrongPass123!" });
    });

    window.location.hash = "";
  });

  it("handles code-based recovery links by exchanging code for session", async () => {
    window.history.replaceState({}, "", "/reset-password?type=recovery&code=test-recovery-code");

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-recovery-code");
    });

    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: "StrongPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: "StrongPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "StrongPass123!" });
    });
  });
});
