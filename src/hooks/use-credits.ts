import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "recharge" | "consume" | "admin_grant";
  description: string;
  created_at: string;
}

export function useCreditTransactions() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["credit-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CreditTransaction[];
    },
    enabled: !!user,
  });

  return { transactions: data ?? [], isLoading, refetch };
}
