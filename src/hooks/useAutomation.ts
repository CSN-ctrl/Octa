import { useState, useEffect, useCallback } from "react";
import * as supabaseService from "@/lib/supabase-service";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type AutomationSetting = Tables<"automation_settings">;
type RecurringPayment = Tables<"recurring_payments">;

export function useAutomation(walletAddress?: string | null) {
  const [automations, setAutomations] = useState<AutomationSetting[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAutomations = useCallback(async () => {
    if (!walletAddress) {
      setAutomations([]);
      setRecurringPayments([]);
      return;
    }

    setLoading(true);
    try {
      const [automationsData, paymentsData] = await Promise.all([
        supabaseService.getAutomationSettings(walletAddress),
        supabaseService.getRecurringPayments({ fromWallet: walletAddress }),
      ]);

      setAutomations(automationsData);
      setRecurringPayments(paymentsData);
    } catch (error: any) {
      console.error("Error fetching automations:", error);
      toast.error("Failed to fetch automation settings");
      setAutomations([]);
      setRecurringPayments([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const createAutomation = async (data: {
    portfolio_id?: string;
    automation_type: 'auto_reinvest' | 'recurring_deposit' | 'rebalance';
    config: any;
  }) => {
    if (!walletAddress) {
      toast.error("Connect wallet first");
      return;
    }

    try {
      await supabaseService.createAutomationSetting({
        owner_wallet: walletAddress,
        portfolio_id: data.portfolio_id || null,
        automation_type: data.automation_type,
        enabled: true,
        config: data.config,
      });
      toast.success("Automation created successfully");
      await fetchAutomations();
    } catch (error: any) {
      console.error("Error creating automation:", error);
      toast.error("Failed to create automation");
    }
  };

  const toggleAutomation = async (id: string, enabled: boolean) => {
    try {
      await supabaseService.updateAutomationSetting(id, { enabled });
      toast.success(`Automation ${enabled ? 'enabled' : 'disabled'}`);
      await fetchAutomations();
    } catch (error: any) {
      console.error("Error toggling automation:", error);
      toast.error("Failed to update automation");
    }
  };

  const createRecurringPayment = async (data: {
    to_wallet?: string;
    amount: number;
    token_type: string;
    frequency: string;
    next_payment_date: string;
  }) => {
    if (!walletAddress) {
      toast.error("Connect wallet first");
      return;
    }

    try {
      await supabaseService.createRecurringPayment({
        from_wallet: walletAddress,
        to_wallet: data.to_wallet || null,
        amount: data.amount,
        token_type: data.token_type,
        frequency: data.frequency,
        next_payment_date: data.next_payment_date,
        enabled: true,
        payment_count: 0,
      });
      toast.success("Recurring payment created");
      await fetchAutomations();
    } catch (error: any) {
      console.error("Error creating recurring payment:", error);
      toast.error("Failed to create recurring payment");
    }
  };

  return {
    automations,
    recurringPayments,
    loading,
    createAutomation,
    toggleAutomation,
    createRecurringPayment,
    refresh: fetchAutomations,
  };
}
