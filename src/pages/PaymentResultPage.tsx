import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Coins, LayoutDashboard, RefreshCw } from "lucide-react";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuccess = location.pathname.includes("success");
  const credits = searchParams.get("credits");

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-chart-4/10 mx-auto ring-4 ring-chart-4/20">
            <CheckCircle className="h-12 w-12 text-chart-4" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">支付成功！</h1>
            {credits && (
              <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                <Coins className="h-5 w-5 text-primary" />
                <span>
                  已充值 <span className="font-bold text-foreground">{parseInt(credits).toLocaleString()}</span> 积分
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">积分已到账，可立即使用 AI 分析功能</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => navigate("/dashboard/analysis")}
              className="gradient-primary text-primary-foreground"
            >
              立即分析
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-border/50"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              控制台
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/credits")}
            className="text-muted-foreground"
          >
            查看积分记录
          </Button>
        </div>
      </div>
    );
  }

  // Failed
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 mx-auto ring-4 ring-destructive/20">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">支付失败</h1>
          <p className="text-sm text-muted-foreground">订单未完成或已过期，请重新下单</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/dashboard/credits")}
            className="gradient-primary text-primary-foreground"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重新下单
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-border/50"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            控制台
          </Button>
        </div>
      </div>
    </div>
  );
}
