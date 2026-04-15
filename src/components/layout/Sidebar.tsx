import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = profile?.role === "admin";

  const mainNavItems: NavItem[] = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: "/analysis", label: "New Analysis", icon: <FileUp className="h-5 w-5" /> },
    { to: "/reports", label: "My Reports", icon: <FileText className="h-5 w-5" /> },
    { to: "/credits", label: "Credits", icon: <Coins className="h-5 w-5" /> },
    { to: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ];

  const adminNavItems: NavItem[] = [
    { to: "/admin", label: "Admin Overview", icon: <Shield className="h-5 w-5" /> },
    { to: "/admin/users", label: "Manage Users", icon: <Users className="h-5 w-5" /> },
    { to: "/admin/models", label: "AI Models", icon: <BrainCircuit className="h-5 w-5" /> },
    { to: "/admin/reports", label: "All Reports", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-gradient-primary">DataViz AI</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        <p className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", collapsed && "sr-only")}>
          Main
        </p>
        {mainNavItems.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}

        {isAdmin && (
          <>
            <div className="my-3 mx-3 border-t border-border/50" />
            <p className={cn("px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider", collapsed && "sr-only")}>
              Admin
            </p>
            {adminNavItems.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
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
      end={item.to === "/"}
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
