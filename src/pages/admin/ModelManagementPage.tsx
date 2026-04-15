import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrainCircuit, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  is_active: boolean;
  cost_per_analysis: number;
  api_endpoint: string;
  api_key_env: string;
  description: string;
  max_tokens: number;
  temperature: number;
  created_at: string;
}

const defaultForm = {
  name: "",
  provider: "",
  model_id: "",
  cost_per_analysis: "10",
  api_endpoint: "https://api.enter.pro/code/api/v1/ai/messages",
  api_key_env: "AI_API_TOKEN_29132ba50817",
  description: "",
  max_tokens: "8000",
  temperature: "0.3",
};

export default function ModelManagementPage() {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [deletingModel, setDeletingModel] = useState<AIModel | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const { data: models, isLoading, refetch } = useQuery({
    queryKey: ["admin-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_models")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AIModel[];
    },
  });

  const openAddDialog = () => {
    setEditingModel(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (model: AIModel) => {
    setEditingModel(model);
    setForm({
      name: model.name,
      provider: model.provider,
      model_id: model.model_id,
      cost_per_analysis: String(model.cost_per_analysis),
      api_endpoint: model.api_endpoint || defaultForm.api_endpoint,
      api_key_env: model.api_key_env || defaultForm.api_key_env,
      description: model.description || "",
      max_tokens: String(model.max_tokens || 8000),
      temperature: String(model.temperature || 0.3),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      provider: form.provider,
      model_id: form.model_id,
      cost_per_analysis: parseInt(form.cost_per_analysis),
      api_endpoint: form.api_endpoint,
      api_key_env: form.api_key_env,
      description: form.description,
      max_tokens: parseInt(form.max_tokens),
      temperature: parseFloat(form.temperature),
    };

    if (editingModel) {
      const { error } = await supabase.from("ai_models").update(payload).eq("id", editingModel.id);
      if (error) {
        toast({ title: t("common.error"), description: t("admin.models.updateFailed"), variant: "destructive" });
      } else {
        toast({ title: t("admin.models.updated"), description: t("admin.models.updatedDesc") });
      }
    } else {
      const { error } = await supabase.from("ai_models").insert({ ...payload, is_active: true });
      if (error) {
        toast({ title: t("common.error"), description: t("admin.models.createFailed"), variant: "destructive" });
      } else {
        toast({ title: t("admin.models.created"), description: t("admin.models.createdDesc") });
      }
    }
    setDialogOpen(false);
    refetch();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingModel) return;
    const { error } = await supabase.from("ai_models").delete().eq("id", deletingModel.id);
    if (error) {
      toast({ title: t("common.error"), description: t("admin.models.deleteFailed"), variant: "destructive" });
    } else {
      toast({ title: t("admin.models.deleted"), description: t("admin.models.deletedDesc") });
    }
    setDeleteDialogOpen(false);
    setDeletingModel(null);
    refetch();
  };

  const toggleActive = async (model: AIModel) => {
    await supabase.from("ai_models").update({ is_active: !model.is_active }).eq("id", model.id);
    refetch();
  };

  const updateField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.models.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("admin.models.subtitle")}</p>
        </div>
        <Button onClick={openAddDialog} className="gradient-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.models.addModel")}
        </Button>
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (models ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BrainCircuit className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">{t("admin.models.noModels")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.models.col.model")}</TableHead>
                  <TableHead>{t("admin.models.col.provider")}</TableHead>
                  <TableHead>{t("admin.models.col.modelId")}</TableHead>
                  <TableHead>{t("admin.models.col.endpoint")}</TableHead>
                  <TableHead>{t("admin.models.col.cost")}</TableHead>
                  <TableHead>{t("admin.models.col.active")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(models ?? []).map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{model.name}</p>
                        {model.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{model.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{model.provider}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{model.model_id}</TableCell>
                    <TableCell className="text-muted-foreground text-xs truncate max-w-[180px]">{model.api_endpoint}</TableCell>
                    <TableCell>{model.cost_per_analysis} {t("common.credits")}</TableCell>
                    <TableCell>
                      <Switch checked={model.is_active} onCheckedChange={() => toggleActive(model)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(model)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setDeletingModel(model); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModel ? t("admin.models.editModel") : t("admin.models.addNew")}</DialogTitle>
            <DialogDescription>{t("admin.models.configDesc")}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">{t("admin.models.basicInfo")}</TabsTrigger>
              <TabsTrigger value="api" className="flex-1">{t("admin.models.apiConfig")}</TabsTrigger>
              <TabsTrigger value="params" className="flex-1">{t("admin.models.params")}</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("admin.models.displayName")}</Label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g., Claude Sonnet 4.5" />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.models.provider")}</Label>
                <Input value={form.provider} onChange={(e) => updateField("provider", e.target.value)} placeholder="e.g., Anthropic" />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.models.modelId")}</Label>
                <Input value={form.model_id} onChange={(e) => updateField("model_id", e.target.value)} placeholder="e.g., anthropic/claude-sonnet-4.5" />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.models.description")}</Label>
                <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Model description..." rows={2} />
              </div>
            </TabsContent>
            <TabsContent value="api" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("admin.models.apiEndpoint")}</Label>
                <Input value={form.api_endpoint} onChange={(e) => updateField("api_endpoint", e.target.value)} placeholder="https://api.enter.pro/code/api/v1/ai/messages" />
                <p className="text-xs text-muted-foreground">Enter Cloud API: https://api.enter.pro/code/api/v1/ai/messages</p>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.models.apiKeyEnv")}</Label>
                <Input value={form.api_key_env} onChange={(e) => updateField("api_key_env", e.target.value)} placeholder="AI_API_TOKEN_29132ba50817" />
                <p className="text-xs text-muted-foreground">Enter Cloud Token: AI_API_TOKEN_29132ba50817</p>
              </div>
            </TabsContent>
            <TabsContent value="params" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("admin.models.costPerAnalysis")}</Label>
                <Input type="number" min="1" value={form.cost_per_analysis} onChange={(e) => updateField("cost_per_analysis", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.models.maxTokens")}</Label>
                <Input type="number" min="100" max="128000" value={form.max_tokens} onChange={(e) => updateField("max_tokens", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.models.temperature")}</Label>
                <Input type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={(e) => updateField("temperature", e.target.value)} />
                <p className="text-xs text-muted-foreground">0 = deterministic, 1 = creative, 2 = very random</p>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.model_id || !form.api_endpoint}
              className="gradient-primary text-primary-foreground"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModel ? t("admin.models.update") : t("admin.models.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.models.delete")} {deletingModel?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.models.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("admin.models.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
