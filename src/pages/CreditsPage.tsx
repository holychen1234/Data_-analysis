import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreditTransactions } from "@/hooks/use-credits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, TrendingUp, TrendingDown, Clock, Loader2 } from "lucide-react";

export default function CreditsPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { transactions, isLoading } = useCreditTransactions();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("credits.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("credits.subtitle")}</p>
      </div>

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

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: t("credits.starter"), credits: 100, description: t("credits.starterDesc") },
          { name: t("credits.pro"), credits: 500, description: t("credits.proDesc") },
          { name: t("credits.enterprise"), credits: 2000, description: t("credits.enterpriseDesc") },
        ].map((plan) => (
          <Card key={plan.name} className="glass border-border/50 hover:glow-primary transition-all">
            <CardContent className="p-5 text-center">
              <p className="text-sm font-medium">{plan.name}</p>
              <p className="text-2xl font-bold mt-2 text-gradient-primary">{plan.credits}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("common.credits")}</p>
              <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
              <p className="text-xs text-muted-foreground mt-3 italic">{t("credits.contactAdmin")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
                      <Badge
                        variant={tx.amount > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {tx.type === "admin_grant" ? t("credits.type.grant") : tx.type === "recharge" ? t("credits.type.recharge") : t("credits.type.used")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.amount > 0 ? "text-chart-4" : "text-destructive"}`}>
                      {tx.amount > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          +{tx.amount}
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-1">
                          <TrendingDown className="h-3.5 w-3.5" />
                          {tx.amount}
                        </span>
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
