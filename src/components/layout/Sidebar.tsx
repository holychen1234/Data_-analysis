import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard,
  FileUp,
  FileText,
  User,
  Coins,
  Shield,
  Users,
  BrainCircuit,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = profile?.role === "admin";

  const mainNavItems: NavItem[] = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: "/dashboard/analysis", label: t("nav.newAnalysis"), icon: <FileUp className="h-5 w-5" /> },
    { to: "/dashboard/reports", label: t("nav.myReports"), icon: <FileText className="h-5 w-5" /> },
    { to: "/dashboard/credits", label: t("nav.credits"), icon: <Coins className="h-5 w-5" /> },
    { to: "/dashboard/profile", label: t("nav.profile"), icon: <User className="h-5 w-5" /> },
  ];

  const adminNavItems: NavItem[] = [
    { to: "/dashboard/admin", label: t("nav.adminOverview"), icon: <Shield className="h-5 w-5" /> },
    { to: "/dashboard/admin/users", label: t("nav.manageUsers"), icon: <Users className="h-5 w-5" /> },
    { to: "/dashboard/admin/models", label: t("nav.aiModels"), icon: <BrainCircuit className="h-5 w-5" /> },
    { to: "/dashboard/admin/reports", label: t("nav.allReports"), icon: <BarChart3 className="h-5 w-5" /> },
    { to: "/dashboard/admin/payments", label: t("nav.payments"), icon: <CreditCard className="h-5 w-5" /> },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary cursor-pointer transition-transform hover:scale-105"
          title={t("nav.backHome")}
        >
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </button>
        {!collapsed && (
          <button onClick={() => navigate("/")} className="text-lg font-bold text-gradient-primary hover:opacity-80 transition-opacity cursor-pointer">
            {t("brand.name")}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        <p className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", collapsed && "sr-only")}>
          {t("nav.main")}
        </p>
        {mainNavItems.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}

        {isAdmin && (
          <>
            <div className="my-3 mx-3 border-t border-border/50" />
            <p className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", collapsed && "sr-only")}>
              {t("nav.adminSection")}
            </p>
            {adminNavItems.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      <div className="p-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/dashboard"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/10 text-primary glow-primary"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )
      }
    >
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}
