import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Shield, User } from "lucide-react";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);

    if (error) {
      toast({ title: t("common.error"), description: t("profile.updateFailed"), variant: "destructive" });
    } else {
      toast({ title: t("profile.updated"), description: t("profile.updatedDesc") });
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("profile.subtitle")}</p>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile?.display_name}</CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
              <Badge variant="secondary" className="mt-1">
                {profile?.role === "admin" ? (
                  <><Shield className="mr-1 h-3 w-3" /> {t("common.admin")}</>
                ) : (
                  <><User className="mr-1 h-3 w-3" /> {t("common.user")}</>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">{t("profile.displayName")}</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.email")}</Label>
            <Input value={profile?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.creditsBalance")}</Label>
            <Input value={profile?.credits?.toLocaleString() ?? "0"} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.memberSince")}</Label>
            <Input
              value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""}
              disabled
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t("profile.saveChanges")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
