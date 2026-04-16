import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReferralCode {
  id: string;
  code: string;
  used_count: number;
  total_credits_earned: number;
  created_at: string;
}

export function useReferral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchCode = async () => {
    if (!user) { setIsLoading(false); return; }
    const { data } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("referrer_id", user.id)
      .maybeSingle();
    setReferralCode(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchCode(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createCode = async () => {
    if (!user || isCreating) return;
    setIsCreating(true);
    // Generate a short unique code: USER prefix + 6 random chars
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const { data, error } = await supabase
      .from("referral_codes")
      .insert({ code, referrer_id: user.id })
      .select()
      .single();

    if (!error && data) setReferralCode(data);
    setIsCreating(false);
  };

  const getReferralLink = () => {
    if (!referralCode) return "";
    return `${window.location.origin}/auth?ref=${referralCode.code}`;
  };

  return { referralCode, isLoading, isCreating, createCode, getReferralLink, refresh: fetchCode };
}
