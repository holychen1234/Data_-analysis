import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreditTransactions } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Coins, TrendingUp, TrendingDown, Clock, Loader2, Share2, Copy, Check, Users, Gift, Smartphone, CreditCard, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "alipay" | "wechat";

interface PaymentPackage {
  id: string;
  name: string;
  credits: number;
  price_yuan: number;
  original_price: number | null;
  is_popular: boolean;
}

export default function CreditsPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { transactions, isLoading } = useCreditTransactions();
  const { referralCode, isLoading: refLoading, isCreating, createCode, getReferralLink } = useReferral();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<PaymentPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("alipay");
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    setLoadingPkgs(true);
    const { data } = await supabase
      .from("payment_packages")
      .select("id, name, credits, price_yuan, original_price, is_popular")
      .eq("is_active", true)
      .order("sort_order");
    setPackages(data || []);
    setLoadingPkgs(false);
  }

  function openPayment(pkg: PaymentPackage) {
    setSelectedPkg(pkg);
    setPaymentMethod("alipay");
    setShowMethodDialog(true);
  }

  async function proceedToPayment() {
    if (!selectedPkg) return;
    setCreating(true);
    navigate(`/dashboard/payment/new?pkg=${selectedPkg.id}&method=${paymentMethod}`);
    setShowMethodDialog(false);
    setCreating(false);
  }

  const handleCopy = () => {
    const link = getReferralLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("credits.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("credits.subtitle")}</p>
      </div>

      {/* Balance card */}
      <Card className="glass border-border/50 glow-primary">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
              <Coins className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("credits.currentBalance")}</p>
              <p className="text-3xl font-bold">{(profile?.credits ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("common.credits")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing tiers */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">充值套餐</h2>
        {loadingPkgs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={cn(
                  "glass border-border/50 hover:glow-primary transition-all relative overflow-hidden cursor-pointer group",
                  pkg.is_popular && "border-primary/50"
                )}
              >
                {pkg.is_popular && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 gradient-primary" />
                )}
                {pkg.is_popular && (
                  <div className="absolute top-3 right-3">
                    <Badge className="text-xs gradient-primary text-primary-foreground border-0">
                      <Star className="h-2.5 w-2.5 mr-1" />热门
                    </Badge>
                  </div>
                )}
                <CardContent className="p-5 text-center space-y-3">
                  <p className="text-sm font-semibold">{pkg.name}</p>
                  <div>
                    <p className="text-3xl font-bold text-gradient-primary">{pkg.credits.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t("common.credits")}</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">¥{pkg.price_yuan}</p>
                    {pkg.original_price && (
                      <p className="text-xs text-muted-foreground line-through">原价 ¥{pkg.original_price}</p>
                    )}
                  </div>
                  <Button
                    className="w-full gradient-primary text-primary-foreground text-sm"
                    size="sm"
                    onClick={() => openPayment(pkg)}
                  >
                    立即购买
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Referral Section */}
      <Card className="glass border-primary/30 overflow-hidden">
        <div className="h-1 w-full gradient-primary" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t("credits.referral.title")}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{t("credits.referral.desc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">{t("credits.referral.invitedUsers")}</span>
              </div>
              <p className="text-2xl font-bold text-primary">{referralCode?.used_count ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Coins className="h-3.5 w-3.5" />
                <span className="text-xs">{t("credits.referral.creditsEarned")}</span>
              </div>
              <p className="text-2xl font-bold text-chart-4">{referralCode?.total_credits_earned ?? 0}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5 text-foreground font-medium">
              <Share2 className="h-3.5 w-3.5 text-primary" />
              {t("credits.referral.howTitle")}
            </p>
            <p>1. {t("credits.referral.step1")}</p>
            <p>2. {t("credits.referral.step2")}</p>
            <p>3. {t("credits.referral.step3")}</p>
          </div>
          {refLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : referralCode ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("credits.referral.yourLink")}</p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                  {getReferralLink()}
                </div>
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 border-primary/30 hover:bg-primary/10">
                  {copied ? <Check className="h-4 w-4 text-chart-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("common.copied") : t("common.copy")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("credits.referral.code")} <span className="font-mono text-primary font-medium">{referralCode.code}</span>
              </p>
            </div>
          ) : (
            <Button onClick={createCode} disabled={isCreating} className="w-full gradient-primary text-primary-foreground">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
              {t("credits.referral.generate")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t("credits.history")}</CardTitle>
          <CardDescription>{t("credits.historyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">{t("credits.noTransactions")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("credits.col.type")}</TableHead>
                  <TableHead>{t("credits.col.description")}</TableHead>
                  <TableHead className="text-right">{t("credits.col.amount")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant={tx.amount > 0 ? "default" : "secondary"} className="text-xs">
                        {tx.type === "admin_grant" ? t("credits.type.grant")
                          : tx.type === "recharge" ? t("credits.type.recharge")
                          : t("credits.type.used")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.amount > 0 ? "text-chart-4" : "text-destructive"}`}>
                      {tx.amount > 0 ? (
                        <span className="flex items-center justify-end gap-1"><TrendingUp className="h-3.5 w-3.5" />+{tx.amount}</span>
                      ) : (
                        <span className="flex items-center justify-end gap-1"><TrendingDown className="h-3.5 w-3.5" />{tx.amount}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment method selection dialog */}
      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>选择支付方式</DialogTitle>
            <DialogDescription>
              {selectedPkg && `${selectedPkg.name} · ${selectedPkg.credits.toLocaleString()} 积分 · ¥${selectedPkg.price_yuan}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {(["alipay", "wechat"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border-2 p-4 transition-all text-left",
                  paymentMethod === m
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/40"
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", m === "alipay" ? "bg-blue-500/10" : "bg-green-500/10")}>
                  {m === "alipay" ? <CreditCard className="h-5 w-5 text-blue-400" /> : <Smartphone className="h-5 w-5 text-green-400" />}
                </div>
                <div>
                  <p className="font-medium">{m === "alipay" ? "支付宝" : "微信支付"}</p>
                  <p className="text-xs text-muted-foreground">{m === "alipay" ? "使用支付宝扫码付款" : "使用微信扫码付款"}</p>
                </div>
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowMethodDialog(false)}>取消</Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={proceedToPayment} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                去支付
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
