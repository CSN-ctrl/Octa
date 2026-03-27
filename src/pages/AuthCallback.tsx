import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useWallet();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const flowType = searchParams.get("type");
        const code = searchParams.get("code");
        const authError =
          searchParams.get("error_description") || searchParams.get("error");

        if (authError) {
          throw new Error(decodeURIComponent(authError));
        }

        // Some Supabase flows provide an auth code that must be exchanged for a session.
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        if (flowType === "recovery") {
          navigate("/reset-password", { replace: true });
          return;
        }

        // Exchange code for session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          if (flowType === "email_change") {
            toast.success("Email change verified successfully.");
            navigate("/account-security");
            return;
          }

          // Update wallet address if connected
          if (isConnected && address) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                wallet_address: address.toLowerCase(),
              },
            });
            
            if (updateError) {
              console.warn("Failed to update wallet address:", updateError);
            }
          }

          // Create/update digital identity if needed
          try {
            const email = session.user.email || session.user.user_metadata?.email;
            if (email) {
              await supabase
                .from("digital_identities")
                .upsert({
                  wallet_address: (isConnected && address) ? address.toLowerCase() : null,
                  name: email.split("@")[0],
                  identity_type: "user",
                });
            }
          } catch (err) {
            console.debug("Digital identity creation skipped:", err);
          }

          toast.success("Signed in successfully!");
          navigate("/dashboard");
        } else {
          throw new Error("No session found");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        toast.error("Authentication failed");
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, isConnected, address, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

