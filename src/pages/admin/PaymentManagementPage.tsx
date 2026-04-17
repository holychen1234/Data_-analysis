import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Coins, Package, Receipt, CheckCircle, Clock, XCircle } from "lucide-react";

interface PaymentPackage {
  id: string;
  name: string;
  credits: number;
  price_yuan: number;
  original_price: number | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

interface PaymentOrder {
  id: string;
  order_no: string;
  user_id: string;
  credits: number;
  amount_yuan: number;
  payment_method: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  profiles?: { email: string; display_name: string };
}

const emptyPkg: Omit<PaymentPackage, "id"> = {
  name: "",
  credits: 500,
  price_yuan: 49.9,
  original_price: null,
  is_popular: false,
  is_active: true,
  sort_order: 0,
};

export default function PaymentManagementPage() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<PaymentPackage | null>(null);
  const [form, setForm] = useState(emptyPkg);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchOrders();
  }, []);

  async function fetchPackages() {
    setLoadingPkgs(true);
    const { data } = await supabase
      .from("payment_packages")
      .select("*")
      .order("sort_order");
    setPackages(data || []);
    setLoadingPkgs(false);
  }

  async function fetchOrders() {
    setLoadingOrders(true);
    const { data } = await supabase
      .from("payment_orders")
      .select("*, profiles(email, display_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    setOrders((data as unknown as PaymentOrder[]) || []);
    setLoadingOrders(false);
  }

  function openAdd() {
    setEditPkg(null);
    setForm(emptyPkg);
    setDialogOpen(true);
  }

  function openEdit(pkg: PaymentPackage) {
    setEditPkg(pkg);
    setForm({
      name: pkg.name,
      credits: pkg.credits,
      price_yuan: pkg.price_yuan,
      original_price: pkg.original_price,
      is_popular: pkg.is_popular,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    });
    setDialogOpen(true);
  }

  async function savePackage() {
    if (!form.name || form.credits <= 0 || form.price_yuan <= 0) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editPkg) {
        await supabase.from("payment_packages").update(form).eq("id", editPkg.id);
        toast({ title: "套餐已更新" });
      } else {
        await supabase.from("payment_packages").insert(form);
        toast({ title: "套餐已创建" });
      }
      setDialogOpen(false);
      fetchPackages();
    } catch (e) {
      toast({ title: "保存失败", variant: "destructive" });
    }
    setSaving(false);
  }

  async function toggleActive(pkg: PaymentPackage) {
    await supabase.from("payment_packages").update({ is_active: !pkg.is_active }).eq("id", pkg.id);
    fetchPackages();
  }

  async function deletePkg(id: string) {
    if (!confirm("确定删除此套餐吗？")) return;
    await supabase.from("payment_packages").delete().eq("id", id);
    toast({ title: "已删除" });
    fetchPackages();
  }

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />已支付</Badge>;
    if (status === "pending") return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />待支付</Badge>;
    return <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" />{status === "expired" ? "已过期" : "失败"}</Badge>;
  };

  const orderStats = {
    total: orders.length,
    paid: orders.filter(o => o.status === "paid").length,
    revenue: orders.filter(o => o.status === "paid").reduce((sum, o) => sum + Number(o.amount_yuan), 0),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">支付管理</h1>
        <p className="text-muted-foreground mt-1">管理充值套餐和查看订单记录</p>
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />套餐管理
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />订单记录
          </TabsTrigger>
        </TabsList>

        {/* Packages tab */}
        <TabsContent value="packages" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">共 {packages.length} 个套餐</p>
            <Button onClick={openAdd} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />添加套餐
            </Button>
          </div>

          <Card className="glass border-border/50">
            <CardContent className="p-0">
              {loadingPkgs ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>套餐名称</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>价格</TableHead>
                      <TableHead>原价</TableHead>
                      <TableHead>推荐</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>排序</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5 text-primary" />{pkg.credits.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gradient-primary">¥{pkg.price_yuan}</TableCell>
                        <TableCell className="text-muted-foreground line-through text-sm">
                          {pkg.original_price ? `¥${pkg.original_price}` : "-"}
                        </TableCell>
                        <TableCell>
                          {pkg.is_popular ? <Badge variant="default" className="text-xs">热门</Badge> : "-"}
                        </TableCell>
                        <TableCell>
                          <Switch checked={pkg.is_active} onCheckedChange={() => toggleActive(pkg)} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{pkg.sort_order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(pkg)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deletePkg(pkg.id)} className="text-destructive hover:text-destructive">
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
        </TabsContent>

        {/* Orders tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "总订单", value: orderStats.total, icon: <Receipt className="h-4 w-4" /> },
              { label: "已支付", value: orderStats.paid, icon: <CheckCircle className="h-4 w-4 text-chart-4" /> },
              { label: "总收入", value: `¥${orderStats.revenue.toFixed(2)}`, icon: <Coins className="h-4 w-4 text-primary" /> },
            ].map((stat) => (
              <Card key={stat.label} className="glass border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">{stat.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass border-border/50">
            <CardContent className="p-0">
              {loadingOrders ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">暂无订单记录</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.order_no}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{(order.profiles as unknown as { display_name: string })?.display_name || "-"}</p>
                            <p className="text-muted-foreground text-xs">{(order.profiles as unknown as { email: string })?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Coins className="h-3 w-3 text-primary" />{order.credits.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">¥{order.amount_yuan}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {order.payment_method === "alipay" ? "支付宝" : "微信"}
                        </TableCell>
                        <TableCell>{statusBadge(order.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(order.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Package dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editPkg ? "编辑套餐" : "添加套餐"}</DialogTitle>
            <DialogDescription>配置积分充值套餐信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>套餐名称</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="入门包" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>积分数量</Label>
                <Input type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} className="mt-1" />
              </div>
              <div>
                <Label>售价（元）</Label>
                <Input type="number" step="0.01" value={form.price_yuan} onChange={e => setForm(f => ({ ...f, price_yuan: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>原价（元，可选）</Label>
                <Input type="number" step="0.01" value={form.original_price ?? ""} onChange={e => setForm(f => ({ ...f, original_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="不填则不显示" className="mt-1" />
              </div>
              <div>
                <Label>排序</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>标记为热门</Label>
              <Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>启用</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={savePackage} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editPkg ? "更新" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
