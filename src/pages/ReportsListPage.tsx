import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Trash2, Eye, FileUp, Loader2 } from "lucide-react";
import { useReports } from "@/hooks/use-reports";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ReportsListPage() {
  const navigate = useNavigate();
  const { reports, isLoading, refetch } = useReports();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this report?")) return;

    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete report", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Report deleted successfully" });
      refetch();
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default" as const;
      case "processing": return "secondary" as const;
      case "failed": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Reports</h1>
          <p className="text-muted-foreground mt-1">View and manage your analysis reports</p>
        </div>
        <Button onClick={() => navigate("/analysis")} className="gradient-primary text-primary-foreground">
          <FileUp className="mr-2 h-4 w-4" />
          New Analysis
        </Button>
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No reports yet</p>
              <Button variant="link" onClick={() => navigate("/analysis")} className="mt-2">
                Create your first analysis
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report.id}
                    className="cursor-pointer hover:bg-secondary/30"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell className="text-muted-foreground">{report.file_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
                    </TableCell>
                    <TableCell>{report.credits_used}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(report.id, e)}
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
    </div>
  );
}
