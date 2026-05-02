import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MailPlus } from "lucide-react";
import { toast } from "sonner";
import { isDashboardAdmin } from "@/lib/dashboard-admin";
import { getAppOrigin } from "@/lib/app-origin";

export default function AdminAuth() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inviteEmail) return;

    setLoading(true);
    try {
      const isAdmin = await isDashboardAdmin(supabase);
      if (!isAdmin) {
        throw new Error("Admin permissions required.");
      }

      // Invite flow using OTP email. shouldCreateUser allows inviting emails that do not yet have accounts.
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: inviteEmail.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${getAppOrigin()}/auth/callback`,
        },
      });
      if (otpError) throw otpError;

      toast.success("Invite email sent.");
      setInviteEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to send invite.");
      toast.error(err.message || "Invite failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page-canvas">
      <div className="mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <Card variant="elevated" className="border-primary/15">
          <CardHeader>
            <CardTitle className="text-xl">Admin Auth Tools</CardTitle>
            <CardDescription>
              Invite users who do not have accounts yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleInvite} className="space-y-3">
              <Label htmlFor="invite-email" className="flex items-center gap-2 text-sm">
                <MailPlus className="h-4 w-4" />
                Invite User Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@email.com"
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Sending invite..." : "Send Invite"}
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
