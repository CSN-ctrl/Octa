import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function AccountSecurity() {
  const [newEmail, setNewEmail] = useState("");
  const [nonce, setNonce] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingReauth, setLoadingReauth] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newEmail) return;

    setLoadingEmail(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
      });
      if (updateError) throw updateError;
      toast.success("Verification email sent. Confirm the new email to complete change.");
      setNewEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to change email.");
      toast.error(err.message || "Email update failed.");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleReauthenticate = async () => {
    setError(null);
    setLoadingReauth(true);
    try {
      const { error: reauthError } = await supabase.auth.reauthenticate();
      if (reauthError) throw reauthError;
      toast.success("Reauthentication email sent. Use the code (nonce) to continue.");
    } catch (err: any) {
      setError(err.message || "Reauthentication failed.");
      toast.error(err.message || "Could not start reauthentication.");
    } finally {
      setLoadingReauth(false);
    }
  };

  const handleSensitivePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!nonce.trim()) {
      setError("Nonce is required. Run reauthentication first.");
      return;
    }

    setLoadingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        nonce: nonce.trim(),
      });
      if (updateError) throw updateError;
      toast.success("Sensitive password update completed.");
      setNonce("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password with nonce.");
      toast.error(err.message || "Sensitive update failed.");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-background px-4 pb-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Account Security</CardTitle>
            <CardDescription>
              Email change verification and reauthentication for sensitive actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleChangeEmail} className="space-y-3">
              <Label htmlFor="new-email" className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                Change Email Address
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                required
              />
              <Button type="submit" disabled={loadingEmail}>
                {loadingEmail ? "Sending verification..." : "Send Email Change Verification"}
              </Button>
            </form>

            <div className="border-t border-border/50 pt-6 space-y-3">
              <Label className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4" />
                Reauthentication (Sensitive Actions)
              </Label>
              <Button type="button" variant="outline" onClick={handleReauthenticate} disabled={loadingReauth}>
                {loadingReauth ? "Sending reauth email..." : "Send Reauthentication Email"}
              </Button>
            </div>

            <form onSubmit={handleSensitivePasswordChange} className="border-t border-border/50 pt-6 space-y-3">
              <Label htmlFor="nonce" className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                Nonce (from reauth email)
              </Label>
              <Input
                id="nonce"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                placeholder="Enter reauthentication nonce"
                required
              />
              <Label htmlFor="sensitive-password" className="text-sm">
                New Password
              </Label>
              <Input
                id="sensitive-password"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
              <Button type="submit" disabled={loadingPassword}>
                {loadingPassword ? "Updating..." : "Update Password with Nonce"}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
