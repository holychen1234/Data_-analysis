import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Loader2, AlertCircle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="outline" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary animate-pulse-glow">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-primary">{t("auth.title")}</h1>
          <p className="text-sm text-muted-foreground text-center">{t("auth.subtitle")}</p>
        </div>

        {referralCode && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            <Gift className="h-4 w-4 shrink-0" />
            <span>{t("auth.referralBanner").replace("{code}", referralCode)}</span>
          </div>
        )}

        <Card className="glass border-border/50">
          <Tabs defaultValue={referralCode ? "register" : "login"}>
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("auth.signIn")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.signUp")}</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="mt-0">
                <RegisterForm referralCode={referralCode} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardDescription className="mb-4">{t("auth.signInDesc")}</CardDescription>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="login-email">{t("auth.email")}</Label>
        <Input id="login-email" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">{t("auth.password")}</Label>
        <Input id="login-password" type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("auth.signInBtn")}
      </Button>
    </form>
  );
}

function RegisterForm({ referralCode }: { referralCode?: string | null }) {
  const { signUp, user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState(referralCode || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // After signup, if referral code exists, process it
  useEffect(() => {
    if (user && referralCode) {
      supabase.functions.invoke("process-referral", {
        body: { referral_code: referralCode },
      }).then(({ error }) => {
        if (error) console.warn("Referral processing:", error);
      });
    }
  }, [user, referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(email, password, name, refCode.trim() || undefined);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="py-6 text-center space-y-2">
        <CardTitle className="text-lg">{t("auth.regSuccess")}</CardTitle>
        <CardDescription>{t("auth.regSuccessDesc")}</CardDescription>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardDescription className="mb-4">{t("auth.signUpDesc")}</CardDescription>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="reg-name">{t("auth.displayName")}</Label>
        <Input id="reg-name" placeholder={t("auth.displayNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">{t("auth.email")}</Label>
        <Input id="reg-email" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">{t("auth.password")}</Label>
        <Input id="reg-password" type="password" placeholder={t("auth.passwordHint")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-refcode" className="flex items-center gap-1.5">
          <Gift className="h-3.5 w-3.5 text-primary" />
          {t("auth.referralCode")}
          <span className="text-muted-foreground text-xs">({t("common.optional")})</span>
        </Label>
        <Input id="reg-refcode" placeholder={t("auth.referralCodePlaceholder")} value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} />
      </div>
      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("auth.signUpBtn")}
      </Button>
    </form>
  );
}
