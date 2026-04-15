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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BrainCircuit, Plus, Loader2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  is_active: boolean;
  cost_per_analysis: number;
  created_at: string;
}

export default function ModelManagementPage() {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [form, setForm] = useState({
    name: "",
    provider: "",
    model_id: "",
    cost_per_analysis: "10",
  });
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
    setForm({ name: "", provider: "", model_id: "", cost_per_analysis: "10" });
    setDialogOpen(true);
  };

  const openEditDialog = (model: AIModel) => {
    setEditingModel(model);
    setForm({
      name: model.name,
      provider: model.provider,
      model_id: model.model_id,
      cost_per_analysis: String(model.cost_per_analysis),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingModel) {
      const { error } = await supabase
        .from("ai_models")
        .update({
          name: form.name,
          provider: form.provider,
          model_id: form.model_id,
          cost_per_analysis: parseInt(form.cost_per_analysis),
        })
        .eq("id", editingModel.id);
      if (error) {
        toast({ title: t("common.error"), description: t("admin.models.updateFailed"), variant: "destructive" });
      } else {
        toast({ title: t("admin.models.updated"), description: t("admin.models.updatedDesc") });
      }
    } else {
      const { error } = await supabase.from("ai_models").insert({
        name: form.name,
        provider: form.provider,
        model_id: form.model_id,
        cost_per_analysis: parseInt(form.cost_per_analysis),
        is_active: true,
      });
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

  const toggleActive = async (model: AIModel) => {
    await supabase
      .from("ai_models")
      .update({ is_active: !model.is_active })
      .eq("id", model.id);
    refetch();
  };

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
                  <TableHead>{t("admin.models.col.cost")}</TableHead>
                  <TableHead>{t("admin.models.col.active")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(models ?? []).map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{model.provider}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {model.model_id}
                    </TableCell>
                    <TableCell>{model.cost_per_analysis} {t("common.credits")}</TableCell>
                    <TableCell>
                      <Switch
                        checked={model.is_active}
                        onCheckedChange={() => toggleActive(model)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(model)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? t("admin.models.editModel") : t("admin.models.addNew")}</DialogTitle>
            <DialogDescription>{t("admin.models.configDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">{t("admin.models.displayName")}</Label>
              <Input
                id="model-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Claude Sonnet 4.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-provider">{t("admin.models.provider")}</Label>
              <Input
                id="model-provider"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                placeholder="e.g., Anthropic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-id">{t("admin.models.modelId")}</Label>
              <Input
                id="model-id"
                value={form.model_id}
                onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                placeholder="e.g., anthropic/claude-sonnet-4.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-cost">{t("admin.models.costPerAnalysis")}</Label>
              <Input
                id="model-cost"
                type="number"
                min="1"
                value={form.cost_per_analysis}
                onChange={(e) => setForm({ ...form, cost_per_analysis: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.model_id}
              className="gradient-primary text-primary-foreground"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModel ? t("admin.models.update") : t("admin.models.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
