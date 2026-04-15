import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUp, X, FileSpreadsheet, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { parseFile, isValidFileType, type ParsedData } from "@/lib/file-parser";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AnalysisStep = "upload" | "configure" | "processing" | "done";

export default function AnalysisPage() {
  const { profile, refreshProfile } = useAuth();
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
      setParseError("Unsupported file type. Please upload CSV or Excel files.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setParseError("File too large. Maximum size is 10MB.");
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
  }, []);

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
        title: "Insufficient Credits",
        description: "You need at least 10 credits for an analysis. Please recharge.",
        variant: "destructive",
      });
      return;
    }

    setStep("processing");
    setProgress(10);

    try {
      // Prepare data subset for AI (limit to avoid token overflow)
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
          requirements: requirements || "Perform a comprehensive data analysis with key statistics, trends, and visualizations.",
        },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setProgress(100);
      setReportId(data.report_id);
      await refreshProfile();
      setStep("done");

      toast({
        title: "Analysis Complete!",
        description: "Your report has been generated successfully.",
      });
    } catch (err) {
      setStep("configure");
      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : "An error occurred during analysis.",
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
        <h1 className="text-2xl font-bold">New Analysis</h1>
        <p className="text-muted-foreground mt-1">Upload your data file and let AI analyze it</p>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Upload Data File</CardTitle>
            <CardDescription>Supports CSV, XLSX, XLS formats (max 10MB)</CardDescription>
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
              <p className="text-sm font-medium mb-1">
                Drag and drop your file here, or click to browse
              </p>
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

      {/* Step: Configure */}
      {step === "configure" && parsedData && (
        <>
          {/* File info */}
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

          {/* Analysis config */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Analysis Requirements</CardTitle>
              <CardDescription>
                Describe what you want to analyze (leave empty for comprehensive analysis)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Your Requirements (Optional)</Label>
                <Textarea
                  id="requirements"
                  placeholder="e.g., Analyze sales trends by month, identify top-performing products, and show regional distribution..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
                <span className="text-sm text-muted-foreground">Cost: 10 credits</span>
                <span className="text-sm font-medium">
                  Balance: {profile?.credits ?? 0} credits
                </span>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">
                <Sparkles className="mr-2 h-4 w-4" />
                Start AI Analysis
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <Card className="glass border-border/50 glow-primary">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary animate-pulse-glow">
                <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI is Analyzing Your Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generating statistics, insights, and visualizations...
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <Card className="glass border-border/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-4/20">
                <Sparkles className="h-8 w-8 text-chart-4" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Analysis Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your report has been generated successfully.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(`/reports/${reportId}`)} className="gradient-primary text-primary-foreground">
                View Report
              </Button>
              <Button variant="outline" onClick={resetAnalysis}>
                New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
