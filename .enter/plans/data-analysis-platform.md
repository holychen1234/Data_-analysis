# Payment System Plan (WeChat Pay / Alipay Framework)

## Context
The user wants to add a payment feature for credit recharging with WeChat Pay and Alipay. Since real merchant credentials are not yet available, we build a complete framework with a "sandbox mode" — the UI and backend are fully functional, and switching to real payments only requires adding secrets later.

---

## Architecture Overview

```
User clicks "Buy"
  → PaymentPage (QR code + countdown)
    → create-payment-order Edge Function
      → sandbox: mock order, auto-confirm after 3s
      → real: call Alipay/WeChat API to get payment URL/QR
  → poll payment status every 2s
  → on success: credit user account + show success page
  → on failure/timeout: show failure page
```

---

## 1. Database Migration

### New table: `payment_packages`
Admin-configurable purchase packages.

```sql
CREATE TABLE payment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- "入门包"
  credits INTEGER NOT NULL,     -- 500
  price_yuan DECIMAL(10,2) NOT NULL,  -- 49.90
  original_price DECIMAL(10,2), -- for showing discount
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New table: `payment_orders`
```sql
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE, -- 20260417143052xxxxx
  user_id UUID NOT NULL REFERENCES profiles(id),
  package_id UUID REFERENCES payment_packages(id),
  credits INTEGER NOT NULL,
  amount_yuan DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,  -- 'alipay' | 'wechat'
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | expired
  provider_order_id TEXT,        -- Alipay/WeChat order ID
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL, -- now() + 15 minutes
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Seed 3 default packages + enable RLS.

---

## 2. Edge Functions

### `create-payment-order`
- Auth check
- Validate package exists and is active
- Generate unique `order_no` (timestamp + random)
- Insert `payment_orders` row with status `pending`
- **Sandbox mode** (no real API keys configured): return mock response with `{ order_id, order_no, qr_code: "mock", sandbox: true }`
- **Real mode**: call Alipay PC/H5 API or WeChat Native Pay API to get payment URL/QR code string
- Return `{ order_id, order_no, payment_url, qr_code, expires_at }`

### `check-payment-status`
- Auth check, validate order belongs to user
- **Sandbox mode**: if order age > 3s, automatically mark as `paid`, credit user
- **Real mode**: query Alipay/WeChat order status API
- On `paid`: update order status, add credits to profile, insert credit_transactions row
- Return `{ status, credits_added }`

### `payment-callback` (webhook)
- Receives async notification from Alipay/WeChat
- Validates signature
- Updates order status + credits user

---

## 3. Frontend Changes

### New: `src/pages/PaymentPage.tsx`
Route: `/dashboard/payment/:orderId`
- Shows package info (credits + price)
- Shows payment method tabs: WeChat Pay QR | Alipay QR
- Countdown timer (15 min expiry)
- Polls `check-payment-status` every 2s
- Sandbox: shows "模拟支付" button that triggers success
- On success → redirect to `/dashboard/payment/success?credits=500`

### New: `src/pages/PaymentResultPage.tsx`
Route: `/dashboard/payment/success` and `/dashboard/payment/failed`
- Success: confetti animation, credits added display, back to dashboard
- Failed: reason + retry button

### New: `src/pages/admin/PaymentManagementPage.tsx`
Route: `/dashboard/admin/payments`
- Tab 1: Package management (CRUD for payment_packages)
- Tab 2: Order management (list all orders, filter by status)

### Modified: `src/pages/CreditsPage.tsx`
- Replace "联系管理员" placeholder buttons with real purchase buttons
- Load packages from `payment_packages` table
- "立即购买" opens payment method selection dialog → navigates to `/dashboard/payment/:orderId`

### Modified: `src/router.tsx`
- Add `/dashboard/payment/:orderId`
- Add `/dashboard/payment/success`
- Add `/dashboard/payment/failed`
- Add `/dashboard/admin/payments`

### Modified: `src/pages/admin/AdminDashboardPage.tsx`
- Add "支付订单管理" link card

### Modified: `src/components/layout/Sidebar.tsx`
- Add "支付管理" under admin section

---

## 4. i18n Keys to Add
```
payment.title, payment.scanning, payment.countdown,
payment.wechat, payment.alipay, payment.sandbox,
payment.sandboxBtn, payment.success.*, payment.failed.*,
payment.package.*, admin.payments.*
```

---

## 5. Secrets Required (fill in when ready)
```
ALIPAY_APP_ID       — 支付宝应用ID
ALIPAY_PRIVATE_KEY  — 应用私钥 (RSA2)
ALIPAY_PUBLIC_KEY   — 支付宝公钥
WECHAT_APP_ID       — 微信应用ID
WECHAT_MCH_ID       — 微信商户号
WECHAT_API_KEY      — 微信API密钥
```
Until configured → sandbox mode auto-activates.

---

## Critical Files Modified
- `src/pages/CreditsPage.tsx` — add purchase buttons
- `src/pages/PaymentPage.tsx` — NEW
- `src/pages/PaymentResultPage.tsx` — NEW
- `src/pages/admin/PaymentManagementPage.tsx` — NEW
- `src/components/layout/Sidebar.tsx` — add payment admin link
- `src/router.tsx` — new routes
- `src/lib/i18n.ts` — new keys
- `supabase/functions/create-payment-order/index.ts` — NEW
- `supabase/functions/check-payment-status/index.ts` — NEW
- `supabase/functions/payment-callback/index.ts` — NEW
- `supabase/migrations/...` — payment_packages + payment_orders tables

---

## Verification
1. Go to Credits page → packages loaded from DB with prices
2. Click "立即购买" → payment method dialog appears
3. Navigate to PaymentPage → QR placeholder + countdown shown
4. Click "模拟支付成功" (sandbox button) → status changes to paid
5. Redirect to success page → credits balance updated
6. Check transaction history → new "充值" entry visible
7. Admin → Payment Management → order visible in list
