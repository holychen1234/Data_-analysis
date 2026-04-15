import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Coins, Loader2, Search, Shield, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Profile } from "@/contexts/AuthContext";

export default function UserManagementPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [grantDialog, setGrantDialog] = useState<{ open: boolean; user: Profile | null }>({
    open: false,
    user: null,
  });
  const [grantAmount, setGrantAmount] = useState("");
  const [granting, setGranting] = useState(false);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filteredUsers = users?.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleGrantCredits = async () => {
    if (!grantDialog.user || !grantAmount) return;
    setGranting(true);

    const { error } = await supabase.functions.invoke("admin-grant-credits", {
      body: {
        user_id: grantDialog.user.id,
        amount: parseInt(grantAmount),
      },
    });

    if (error) {
      toast({ title: t("common.error"), description: t("admin.users.grantFailed"), variant: "destructive" });
    } else {
      toast({ title: t("admin.users.grantSuccess"), description: `${grantAmount} ${t("common.credits")} -> ${grantDialog.user.display_name}` });
      setGrantDialog({ open: false, user: null });
      setGrantAmount("");
      refetch();
    }
    setGranting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.users.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.users.subtitle")}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.users.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.users.col.user")}</TableHead>
                  <TableHead>{t("admin.users.col.role")}</TableHead>
                  <TableHead>{t("admin.users.col.credits")}</TableHead>
                  <TableHead>{t("admin.users.col.joined")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? <Shield className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                        {user.role === "admin" ? t("common.admin") : t("common.user")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{user.credits.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGrantDialog({ open: true, user })}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        <Coins className="mr-1 h-3.5 w-3.5" />
                        {t("admin.users.grantCredits")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={grantDialog.open} onOpenChange={(open) => setGrantDialog({ open, user: grantDialog.user })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.grantTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.users.grantDesc")} - {grantDialog.user?.display_name} ({grantDialog.user?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.users.currentBalance")}{grantDialog.user?.credits.toLocaleString()}</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-amount">{t("admin.users.grantAmount")}</Label>
              <Input
                id="grant-amount"
                type="number"
                min="1"
                placeholder={t("admin.users.grantAmountPlaceholder")}
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog({ open: false, user: null })}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleGrantCredits}
              disabled={granting || !grantAmount}
              className="gradient-primary text-primary-foreground"
            >
              {granting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
              {t("admin.users.grantBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
