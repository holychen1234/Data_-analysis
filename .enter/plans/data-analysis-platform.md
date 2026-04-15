# AI Data Analysis Platform - Implementation Plan

## Context
Build a modular AI data analysis platform with dark tech theme. Users upload CSV/Excel files, AI analyzes data and generates beautiful reports with charts. Features include user auth, credit system, report management, and admin dashboard.

---

## Phase 1: Foundation (Design System + Auth + Database)

### 1.1 Design System - Dark Tech Theme
**Files:** `src/index.css`, `tailwind.config.ts`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`

- Override CSS variables with dark tech palette:
  - Background: deep navy/charcoal (`222 47% 6%`)
  - Primary: electric blue (`217 91% 60%`) with glow effects
  - Accent: cyan/teal gradients
  - Cards: glass-morphism (semi-transparent + blur + border glow)
- Add custom tokens: `--gradient-primary`, `--shadow-glow`, `--glass-bg`, `--glass-border`
- Add keyframe animations: `pulse-glow`, `shimmer`, `float`
- Add button variants: `glow`, `premium`, `hero`
- Add card variant: glass-morphism style

### 1.2 Database Schema (Enter Cloud)
**Tables to create:**

1. **profiles** - User profiles (extends auth.users)
   - `id` (uuid, FK to auth.users)
   - `email`, `display_name`, `avatar_url`
   - `role` (enum: 'user' | 'admin')
   - `credits` (integer, default 0)
   - `created_at`, `updated_at`

2. **credit_transactions** - Credit history
   - `id`, `user_id` (FK), `amount` (integer, +/-)
   - `type` (enum: 'recharge' | 'consume' | 'admin_grant')
   - `description`, `created_at`

3. **reports** - Generated analysis reports
   - `id`, `user_id` (FK), `title`, `file_name`, `file_url`
   - `status` (enum: 'processing' | 'completed' | 'failed')
   - `report_html` (text - the rendered report)
   - `report_data` (jsonb - structured data for charts)
   - `credits_used`, `created_at`

4. **ai_models** - Admin-managed AI model configs
   - `id`, `name`, `provider`, `model_id`
   - `is_active` (boolean), `cost_per_analysis` (integer)
   - `created_at`

- Enable RLS policies for all tables
- Create trigger: auto-create profile on auth.users insert

### 1.3 Authentication
**Files to create:**
- `src/lib/supabase.ts` - Supabase client
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/pages/AuthPage.tsx` - Login/Register page (tab-based)
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/layout/ProtectedRoute.tsx` - Route guard

### 1.4 App Layout
**Files to create:**
- `src/components/layout/AppLayout.tsx` - Main layout with sidebar
- `src/components/layout/Sidebar.tsx` - Navigation sidebar with glow effects
- `src/components/layout/Header.tsx` - Top bar with user info + credits display

---

## Phase 2: Core Feature - File Upload & AI Analysis

### 2.1 File Upload
**Files to create:**
- `src/pages/AnalysisPage.tsx` - Main analysis page
- `src/components/analysis/FileUploader.tsx` - Drag & drop upload zone (CSV/Excel)
- `src/components/analysis/AnalysisConfig.tsx` - User specifies analysis requirements
- `src/lib/file-parser.ts` - Parse CSV/Excel to JSON on frontend (using SheetJS)

**Dependencies to add:** `xlsx` (SheetJS for Excel parsing)

### 2.2 AI Analysis Edge Function
**Edge Function:** `analyze-data`
- Receives: parsed data (JSON) + user prompt/requirements
- Uses LLM (via Enter LLM Integration skill) to:
  1. Analyze the data structure
  2. Generate statistical summaries
  3. Produce chart configurations (for recharts)
  4. Generate insights and recommendations
  5. Return structured JSON with report sections
- Deducts credits from user
- Saves report to database

### 2.3 Report Rendering
**Files to create:**
- `src/pages/ReportPage.tsx` - View single report
- `src/components/report/ReportViewer.tsx` - Render the full report
- `src/components/report/ChartRenderer.tsx` - Dynamic chart rendering (bar, line, pie, area, radar using recharts)
- `src/components/report/DataTable.tsx` - Beautiful data tables
- `src/components/report/StatCard.tsx` - KPI stat cards with animations
- `src/components/report/ReportExporter.tsx` - Export to HTML file

---

## Phase 3: User Features

### 3.1 Dashboard / Home
**Files to create:**
- `src/pages/DashboardPage.tsx` - User dashboard
  - Recent reports list
  - Credit balance display
  - Quick upload shortcut
  - Usage statistics

### 3.2 Report History
**Files to create:**
- `src/pages/ReportsListPage.tsx` - All user reports
  - Table view with status, date, title
  - Click to view report
  - Delete reports

### 3.3 User Profile
**Files to create:**
- `src/pages/ProfilePage.tsx` - User settings
  - Edit display name
  - View credit balance & transaction history
  - Account info

### 3.4 Credits & Recharge
**Files to create:**
- `src/pages/CreditsPage.tsx` - Credits overview
  - Current balance
  - Transaction history table
  - Simulated recharge packages (display only, admin grants credits)

---

## Phase 4: Admin Dashboard

### 4.1 Admin Pages
**Files to create:**
- `src/pages/admin/AdminDashboardPage.tsx` - Overview stats
- `src/pages/admin/UserManagementPage.tsx` - View/manage users, grant credits
- `src/pages/admin/ModelManagementPage.tsx` - Add/edit/toggle AI models
- `src/pages/admin/ReportsManagementPage.tsx` - View all reports
- `src/components/admin/GrantCreditsDialog.tsx` - Dialog to grant credits

### 4.2 Admin Route Guard
- Check `role === 'admin'` in profile
- Separate admin layout with admin-specific sidebar items

---

## Phase 5: Report Export

### 5.1 HTML Export
- Generate self-contained HTML file with embedded styles and chart images
- Include all report sections: summary, charts, tables, insights
- Beautiful dark theme styling in export

---

## Architecture Overview

```
src/
  contexts/
    AuthContext.tsx          # Auth state
  components/
    layout/
      AppLayout.tsx         # Main layout
      Sidebar.tsx           # Nav sidebar
      Header.tsx            # Top bar
      ProtectedRoute.tsx    # Route guard
    auth/
      LoginForm.tsx
      RegisterForm.tsx
    analysis/
      FileUploader.tsx      # Drag-drop upload
      AnalysisConfig.tsx    # Analysis options
    report/
      ReportViewer.tsx      # Full report render
      ChartRenderer.tsx     # Dynamic charts
      DataTable.tsx         # Data tables
      StatCard.tsx          # KPI cards
      ReportExporter.tsx    # Export functionality
    admin/
      GrantCreditsDialog.tsx
  pages/
    AuthPage.tsx
    DashboardPage.tsx
    AnalysisPage.tsx
    ReportPage.tsx
    ReportsListPage.tsx
    ProfilePage.tsx
    CreditsPage.tsx
    admin/
      AdminDashboardPage.tsx
      UserManagementPage.tsx
      ModelManagementPage.tsx
      ReportsManagementPage.tsx
  lib/
    supabase.ts
    file-parser.ts
  hooks/
    use-auth.ts
    use-credits.ts
    use-reports.ts
```

## Route Structure
```
/auth              -> AuthPage (login/register)
/                  -> DashboardPage (redirect if not auth)
/analysis          -> AnalysisPage (upload + analyze)
/reports           -> ReportsListPage
/reports/:id       -> ReportPage
/profile           -> ProfilePage
/credits           -> CreditsPage
/admin             -> AdminDashboardPage
/admin/users       -> UserManagementPage
/admin/models      -> ModelManagementPage
/admin/reports     -> ReportsManagementPage
```

## Edge Functions
1. **analyze-data** - Core AI analysis (LLM integration)
2. **admin-grant-credits** - Admin credit management

## Key Technical Decisions
- **File parsing on frontend** using SheetJS (xlsx) - avoids uploading large files to edge functions
- **Recharts** for charts (already in package.json)
- **framer-motion** for animations (already in package.json)
- **LLM returns structured JSON** with chart configs, not raw HTML
- **Frontend renders** charts from JSON configs - much more flexible
- **HTML export** generates a standalone file with inline SVG charts

## Implementation Order
1. Design system + database schema + auth
2. App layout + routing
3. File upload + AI analysis edge function
4. Report rendering + charts
5. Dashboard + report history
6. Credits system
7. Admin dashboard
8. Export functionality

## Verification
- Test auth flow: register -> login -> see dashboard
- Test file upload: upload CSV -> see analysis in progress -> view report
- Test charts: verify bar/line/pie charts render from AI response
- Test credits: verify deduction on analysis, admin grant
- Test admin: login as admin -> manage users/models
- Test export: download HTML report, open in browser
- Test responsive: verify mobile layout works
