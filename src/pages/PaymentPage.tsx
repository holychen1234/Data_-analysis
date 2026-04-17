import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Clock, CheckCircle, XCircle, Loader2, Smartphone, CreditCard, QrCode, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "alipay" | "wechat";

interface OrderInfo {
  order_id: string;
  order_no: string;
  credits: number;
  amount_yuan: number;
  package_name: string;
  expires_at: string;
  sandbox: boolean;
  qr_code: string | null;
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const packageId = searchParams.get("pkg");

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (searchParams.get("method") as PaymentMethod) || "alipay"
  );
  const [status, setStatus] = useState<"creating" | "pending" | "paid" | "failed" | "expired">("creating");
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 min
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create order on mount
  useEffect(() => {
    if (!packageId) {
      navigate("/dashboard/credits");
      return;
    }
    createOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createOrder() {
    setStatus("creating");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const { data, error: fnError } = await supabase.functions.invoke("create-payment-order", {
        body: { package_id: packageId, payment_method: paymentMethod },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fnError || data?.error) throw new Error(data?.error || fnError?.message);
      setOrderInfo(data);
      setStatus("pending");
    } catch (err) {
      setError((err as Error).message);
      setStatus("failed");
    }
  }

  // Countdown timer
  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Poll payment status
  useEffect(() => {
    if (status !== "pending" || !orderInfo) return;
    pollRef.current = setInterval(() => checkStatus(), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, orderInfo]);

  async function checkStatus(confirm = false) {
    if (!orderInfo) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const { data, error: fnError } = await supabase.functions.invoke("check-payment-status", {
        body: { order_id: orderInfo.order_id, confirm },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fnError) return;
      if (data?.status === "paid") {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus("paid");
        setTimeout(() => navigate(`/dashboard/payment/success?credits=${orderInfo.credits}`), 1500);
      } else if (data?.status === "expired" || data?.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus(data.status);
      }
    } catch (_) { /* silent */ }
  }

  async function handleSandboxConfirm() {
    setIsConfirming(true);
    await checkStatus(true);
    setIsConfirming(false);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (status === "creating") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">正在创建订单...</p>
        </div>
      </div>
    );
  }

  if (status === "failed" && !orderInfo) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">创建订单失败</h2>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button onClick={() => navigate("/dashboard/credits")} variant="outline">返回积分页面</Button>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 animate-fade-in">
          <CheckCircle className="h-16 w-16 text-chart-4 mx-auto" />
          <h2 className="text-2xl font-bold">支付成功！</h2>
          <p className="text-muted-foreground">正在跳转...</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <Clock className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">订单已过期</h2>
        <p className="text-muted-foreground text-sm">订单超过 15 分钟未支付，已自动关闭</p>
        <Button onClick={() => navigate("/dashboard/credits")} variant="outline">返回重新下单</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">积分充值</h1>
        <p className="text-muted-foreground mt-1">完成支付，积分立即到账</p>
      </div>

      {/* Order summary */}
      <Card className="glass border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">{orderInfo?.package_name}</p>
                <p className="text-sm text-muted-foreground">{orderInfo?.credits.toLocaleString()} 积分</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gradient-primary">¥{orderInfo?.amount_yuan}</p>
              <p className="text-xs text-muted-foreground">订单号 {orderInfo?.order_no}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Countdown */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">订单有效期：</span>
        <span className={cn("font-mono font-bold", secondsLeft < 60 ? "text-destructive" : "text-foreground")}>
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Payment method tabs */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">选择支付方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["alipay", "wechat"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all text-sm font-medium",
                  paymentMethod === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {m === "alipay" ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                {m === "alipay" ? "支付宝" : "微信支付"}
              </button>
            ))}
          </div>

          {/* QR Code area */}
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20 py-10 gap-4">
            {orderInfo?.sandbox ? (
              <>
                <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-muted/40 border border-border/50">
                  <QrCode className="h-16 w-16 text-muted-foreground/40" />
                </div>
                <div className="text-center space-y-1">
                  <Badge variant="warning" className="mb-2">沙盒测试模式</Badge>
                  <p className="text-xs text-muted-foreground">真实支付密钥尚未配置</p>
                  <p className="text-xs text-muted-foreground">点击下方按钮模拟支付成功</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-white p-2">
                  <QrCode className="h-20 w-20 text-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  请使用{paymentMethod === "alipay" ? "支付宝" : "微信"}扫描二维码完成支付
                </p>
              </>
            )}
          </div>

          {/* Sandbox confirm button */}
          {orderInfo?.sandbox && (
            <Button
              onClick={handleSandboxConfirm}
              disabled={isConfirming}
              className="w-full gradient-primary text-primary-foreground"
              size="lg"
            >
              {isConfirming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              模拟支付成功
            </Button>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-muted/20 p-3 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>支付成功后积分将自动到账，如有问题请联系客服</span>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/credits")} className="text-muted-foreground">
          取消支付
        </Button>
      </div>
    </div>
  );
}
