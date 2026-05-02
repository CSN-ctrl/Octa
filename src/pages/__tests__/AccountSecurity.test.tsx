import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountSecurity from "../AccountSecurity";

const mockUpdateUser = vi.fn();
const mockReauthenticate = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      reauthenticate: (...args: any[]) => mockReauthenticate(...args),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AccountSecurity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUser.mockResolvedValue({ error: null });
    mockReauthenticate.mockResolvedValue({ error: null });
  });

  it("sends email change verification", async () => {
    render(<AccountSecurity />);
    fireEvent.change(screen.getByLabelText(/Change Email Address/i), {
      target: { value: "new@email.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send Email Change Verification/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ email: "new@email.com" });
    });
  });

  it("starts reauthentication", async () => {
    render(<AccountSecurity />);
    fireEvent.click(screen.getByRole("button", { name: /Send Reauthentication Email/i }));

    await waitFor(() => {
      expect(mockReauthenticate).toHaveBeenCalled();
    });
  });
});
