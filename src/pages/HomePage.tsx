import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  FileUp,
  FileText,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  PieChart,
  TrendingUp,
  Download,
  BrainCircuit,
  ChevronRight,
} from "lucide-react";
import { useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <BarChart3 className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-primary">{t("brand.name")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="gradient-primary text-primary-foreground">
                {t("home.dashboard")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  {t("home.signIn")}
                </Button>
                <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground">
                  {t("home.getStarted")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-accent/8 blur-[100px]" />
          <div className="absolute top-40 right-10 h-64 w-64 rounded-full bg-chart-3/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.badge")}
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            <span className="text-foreground">{t("home.heroTitle1")}</span>
            <br />
            <span className="text-gradient-primary">{t("home.heroTitle2")}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t("home.heroDesc")}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="gradient-primary text-primary-foreground h-12 px-8 text-base glow-primary hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all"
            >
              <FileUp className="mr-2 h-5 w-5" />
              {t("home.startAnalysis")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="h-12 px-8 text-base border-primary/20 hover:bg-primary/5"
            >
              {t("home.learnMore")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "5+", label: t("home.stat.charts") },
              { value: "AI", label: t("home.stat.ai") },
              { value: "HTML", label: t("home.stat.export") },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-gradient-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 relative">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">
              <span className="text-gradient-primary">{t("home.howItWorks")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              {t("home.howItWorksDesc")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", icon: <FileUp className="h-6 w-6" />, title: t("home.step1.title"), desc: t("home.step1.desc") },
              { step: "02", icon: <BrainCircuit className="h-6 w-6" />, title: t("home.step2.title"), desc: t("home.step2.desc") },
              { step: "03", icon: <Download className="h-6 w-6" />, title: t("home.step3.title"), desc: t("home.step3.desc") },
            ].map((item) => (
              <Card key={item.step} className="glass border-border/30 hover:glow-primary transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-primary/50">{item.step}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-0 h-96 w-96 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">
              <span className="text-gradient-accent">{t("home.features")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              {t("home.featuresDesc")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <PieChart className="h-5 w-5" />, title: t("home.feat.charts"), desc: t("home.feat.chartsDesc") },
              { icon: <TrendingUp className="h-5 w-5" />, title: t("home.feat.stats"), desc: t("home.feat.statsDesc") },
              { icon: <Sparkles className="h-5 w-5" />, title: t("home.feat.insights"), desc: t("home.feat.insightsDesc") },
              { icon: <FileText className="h-5 w-5" />, title: t("home.feat.export"), desc: t("home.feat.exportDesc") },
              { icon: <Shield className="h-5 w-5" />, title: t("home.feat.secure"), desc: t("home.feat.secureDesc") },
              { icon: <Zap className="h-5 w-5" />, title: t("home.feat.fast"), desc: t("home.feat.fastDesc") },
            ].map((feature) => (
              <Card key={feature.title} className="glass border-border/30 hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Card className="glass border-primary/20 glow-primary p-8 md:p-12">
            <CardContent className="p-0 space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mx-auto animate-pulse-glow">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">
                {t("home.cta.title")}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("home.cta.desc")}
              </p>
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="gradient-primary text-primary-foreground h-12 px-10 text-base"
              >
                {user ? t("home.cta.btnLoggedIn") : t("home.cta.btn")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
              <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-gradient-primary">{t("brand.name")}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("brand.tagline")}
          </p>
        </div>
      </footer>
    </div>
  );
}
