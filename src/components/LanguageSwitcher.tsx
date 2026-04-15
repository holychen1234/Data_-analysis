import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { locale, setLocale } = useLanguage();

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="gap-1.5 text-xs"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "zh" ? "EN" : "中"}
    </Button>
  );
}
