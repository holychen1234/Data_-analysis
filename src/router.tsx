import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import AnalysisPage from "./pages/AnalysisPage";
import ReportsListPage from "./pages/ReportsListPage";
import ReportPage from "./pages/ReportPage";
import ProfilePage from "./pages/ProfilePage";
import CreditsPage from "./pages/CreditsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ModelManagementPage from "./pages/admin/ModelManagementPage";
import ReportsManagementPage from "./pages/admin/ReportsManagementPage";
import PaymentManagementPage from "./pages/admin/PaymentManagementPage";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <HomePage />,
  },
  {
    path: "/auth",
    name: "auth",
    element: <AuthPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, name: "dashboard", element: <DashboardPage /> },
      { path: "analysis", name: "analysis", element: <AnalysisPage /> },
      { path: "reports", name: "reports", element: <ReportsListPage /> },
      { path: "reports/:id", name: "report-detail", element: <ReportPage /> },
      { path: "profile", name: "profile", element: <ProfilePage /> },
      { path: "credits", name: "credits", element: <CreditsPage /> },
      { path: "payment/new", name: "payment-new", element: <PaymentPage /> },
      { path: "payment/success", name: "payment-success", element: <PaymentResultPage /> },
      { path: "payment/failed", name: "payment-failed", element: <PaymentResultPage /> },
      {
        path: "admin",
        name: "admin",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        name: "admin-users",
        element: (
          <ProtectedRoute requireAdmin>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/models",
        name: "admin-models",
        element: (
          <ProtectedRoute requireAdmin>
            <ModelManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/reports",
        name: "admin-reports",
        element: (
          <ProtectedRoute requireAdmin>
            <ReportsManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/payments",
        name: "admin-payments",
        element: (
          <ProtectedRoute requireAdmin>
            <PaymentManagementPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
