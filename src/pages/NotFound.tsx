import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gradient-primary">{t("notFound.title")}</h1>
        <p className="text-xl text-muted-foreground">{t("notFound.desc")}</p>
        <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10">
          <a href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("notFound.back")}
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
