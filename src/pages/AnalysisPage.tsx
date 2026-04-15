import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUp, X, FileSpreadsheet, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { parseFile, isValidFileType, type ParsedData } from "@/lib/file-parser";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AnalysisStep = "upload" | "configure" | "processing" | "done";

export default function AnalysisPage() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<AnalysisStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [requirements, setRequirements] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [reportId, setReportId] = useState<string | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setParseError(null);
    if (!isValidFileType(f.name)) {
      setParseError(t("analysis.unsupported"));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setParseError(t("analysis.tooLarge"));
      return;
    }
    try {
      setFile(f);
      const data = await parseFile(f);
      setParsedData(data);
      setStep("configure");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse file");
    }
  }, [t]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!parsedData || !file || !profile) return;

    if ((profile.credits ?? 0) < 10) {
      toast({
        title: t("analysis.insufficientCredits"),
        description: t("analysis.insufficientCreditsDesc"),
        variant: "destructive",
      });
      return;
    }

    setStep("processing");
    setProgress(10);

    try {
      const dataSubset = parsedData.rows.slice(0, 100);
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 85));
      }, 2000);

      const { data, error } = await supabase.functions.invoke("analyze-data", {
        body: {
          file_name: file.name,
          headers: parsedData.headers,
          rows: dataSubset,
          summary: parsedData.summary,
          requirements: requirements || t("analysis.defaultReq"),
        },
      });

      clearInterval(progressInterval);

      if (error) throw new Error(error.message || t("analysis.failed"));
      if (data?.error) throw new Error(data.error);

      setProgress(100);
      setReportId(data.report_id);
      await refreshProfile();
      setStep("done");

      toast({
        title: t("analysis.complete"),
        description: t("analysis.completeDesc"),
      });
    } catch (err) {
      setStep("configure");
      toast({
        title: t("analysis.failed"),
        description: err instanceof Error ? err.message : t("analysis.failed"),
        variant: "destructive",
      });
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setParsedData(null);
    setRequirements("");
    setStep("upload");
    setProgress(0);
    setReportId(null);
    setParseError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("analysis.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("analysis.subtitle")}</p>
      </div>

      {step === "upload" && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>{t("analysis.uploadTitle")}</CardTitle>
            <CardDescription>{t("analysis.uploadDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5 glow-primary"
                  : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <FileUp className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">{t("analysis.dragDrop")}</p>
              <p className="text-xs text-muted-foreground">CSV, XLSX, XLS</p>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
            {parseError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "configure" && parsedData && (
        <>
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {parsedData.summary.totalRows} rows x {parsedData.summary.totalColumns} columns
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetAnalysis}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {parsedData.headers.map((h) => (
                  <Badge key={h} variant="secondary" className="text-xs">
                    {h}
                    <span className="ml-1 text-muted-foreground">
                      ({parsedData.summary.columnTypes[h]})
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>{t("analysis.requirementsTitle")}</CardTitle>
              <CardDescription>{t("analysis.requirementsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">{t("analysis.requirementsLabel")}</Label>
                <Textarea
                  id="requirements"
                  placeholder={t("analysis.requirementsPlaceholder")}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
                <span className="text-sm text-muted-foreground">{t("analysis.cost")}</span>
                <span className="text-sm font-medium">
                  {t("analysis.balance")}{profile?.credits ?? 0} {t("common.credits")}
                </span>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">
                <Sparkles className="mr-2 h-4 w-4" />
                {t("analysis.startAI")}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {step === "processing" && (
        <Card className="glass border-border/50 glow-primary">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary animate-pulse-glow">
                <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t("analysis.aiAnalyzing")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("analysis.generating")}</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card className="glass border-border/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-4/20">
                <Sparkles className="h-8 w-8 text-chart-4" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t("analysis.complete")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("analysis.completeDesc")}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(`/dashboard/reports/${reportId}`)} className="gradient-primary text-primary-foreground">
                {t("analysis.viewReport")}
              </Button>
              <Button variant="outline" onClick={resetAnalysis}>
                {t("analysis.newAnalysis")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
