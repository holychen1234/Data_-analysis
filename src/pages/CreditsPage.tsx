import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreditTransactions } from "@/hooks/use-credits";
import { useReferral } from "@/hooks/use-referral";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, TrendingUp, TrendingDown, Clock, Loader2, Share2, Copy, Check, Users, Gift } from "lucide-react";

export default function CreditsPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { transactions, isLoading } = useCreditTransactions();
  const { referralCode, isLoading: refLoading, isCreating, createCode, getReferralLink } = useReferral();
  const [copied, setCopied] = useState(false);

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
          {/* Stats row */}
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

          {/* Reward info */}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5 text-foreground font-medium">
              <Share2 className="h-3.5 w-3.5 text-primary" />
              {t("credits.referral.howTitle")}
            </p>
            <p>1. {t("credits.referral.step1")}</p>
            <p>2. {t("credits.referral.step2")}</p>
            <p>3. {t("credits.referral.step3")}</p>
          </div>

          {/* Link generator */}
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

      {/* Pricing tiers */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: t("credits.starter"), credits: 500, description: t("credits.starterDesc") },
          { name: t("credits.pro"), credits: 2000, description: t("credits.proDesc") },
          { name: t("credits.enterprise"), credits: 10000, description: t("credits.enterpriseDesc") },
        ].map((plan) => (
          <Card key={plan.name} className="glass border-border/50 hover:glow-primary transition-all">
            <CardContent className="p-5 text-center">
              <p className="text-sm font-medium">{plan.name}</p>
              <p className="text-2xl font-bold mt-2 text-gradient-primary">{plan.credits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("common.credits")}</p>
              <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
              <p className="text-xs text-muted-foreground mt-3 italic">{t("credits.contactAdmin")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
