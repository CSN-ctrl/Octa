import { useState, useEffect, useCallback } from "react";
import { db, AutomationSetting, RecurringPayment, generateId } from "@/lib/local-db";
import { toast } from "sonner";

// Re-export types for compatibility
export type { AutomationSetting, RecurringPayment };

export function useAutomation(walletAddress?: string | null) {
  const [automations, setAutomations] = useState<AutomationSetting[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAutomations = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const [automationsData, paymentsData] = await Promise.all([
        db.automationSettings
          .where('owner_wallet')
          .equals(walletAddress)
          .toArray(),
        db.recurringPayments
          .where('from_wallet')
          .equals(walletAddress)
          .toArray(),
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
      const id = generateId('automation');
      const now = new Date().toISOString();
      
      const automation: AutomationSetting = {
        id,
        owner_wallet: walletAddress,
        portfolio_id: data.portfolio_id,
        automation_type: data.automation_type,
        enabled: true,
        config: data.config,
        created_at: now,
      };

      await db.automationSettings.add(automation);
      toast.success("Automation created successfully");
      await fetchAutomations();
    } catch (error: any) {
      console.error("Error creating automation:", error);
      toast.error("Failed to create automation");
    }
  };

  const toggleAutomation = async (id: string, enabled: boolean) => {
    try {
      await db.automationSettings.update(id, { enabled });
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
      const id = generateId('payment');
      const now = new Date().toISOString();
      
      const payment: RecurringPayment = {
        id,
        from_wallet: walletAddress,
        to_wallet: data.to_wallet,
        amount: data.amount,
        token_type: data.token_type,
        frequency: data.frequency,
        next_payment_date: data.next_payment_date,
        enabled: true,
        created_at: now,
        payment_count: 0,
      };

      await db.recurringPayments.add(payment);
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
