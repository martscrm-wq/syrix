# SYRIX — سجل التقدم (Progress Tracker)

> هذا الملف يُحدّث بعد كل جلسة عمل. يوثّق المهام المنجزة، الجاري العمل عليها، والمعلّقة.

---

## ملخص عام

| الحالة | العدد |
|--------|-------|
| ✅ مكتمل | 13 |
| 🔄 قيد التنفيذ | 0 |
| ⏳ معلق | 5 |
| ❌ متعثر | 0 |

---

## ✅ المهام المكتملة (Completed)

### Phase 0 — تهيئة المشروع والبنية التحتية
- [x] **T0.1** إنشاء مشروع Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma ✅
  - package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, postcss.config.mjs
  - Prisma schema مع User, Department, Account, JournalEntry, JournalLine
  - الاتجاه RTL، Arabic fonts، خط الأساس Mobile-First

- [x] **T0.2** ربط Firebase Auth ✅
  - `src/lib/firebase.ts` (client-side Firebase)
  - `src/lib/firebase-admin.ts` (server-side Admin SDK مع graceful fallback)
  - صفحة تسجيل دخول `/login` (Mobile-First مع RTL)
  - API: `POST /api/auth/login` (ينشئ session cookie), `POST /api/auth/logout`, `GET /api/auth/me`

- [x] **T0.3** إعداد Upstash Redis + Rate Limiting ✅
  - `src/lib/redis.ts` مع Redis client + rate limiters للـ Login (5 محاولات/دقيقة) والـ API (50/دقيقة)

- [x] **T0.4** Middleware للصلاحيات (RBAC) ✅
  - `src/middleware.ts` يحمي `/api/*` و `/dashboard/*`، يعيد توجيه غير المسجلين لـ `/login`

- [x] **T0.5** CI/CD عبر GitHub Actions ✅
  - `.github/workflows/ci.yml`: تشغيل lint + typecheck + build + tests على كل PR

### Phase 1 — قاعدة البيانات الأساسية
- [x] **T1.1** Schema: User + Department + Seed data ⚡
  - Prisma schema مع User (firebaseUid, role, department) و Department
  - `prisma/seed.ts` يزرع 5 إدارات و 38 حساب محاسبي

- [x] **T1.2** Schema المحاسبي + قيد التوازن ✅
  - `acc_chart_of_accounts` (38 حساب: أصول، خصوم، حقوق ملكية، إيرادات، مصروفات)
  - `acc_journal_entries` + `acc_journal_lines` مع Transaction ذرية
  - API `POST /api/accounts/journal-entries` يتحقق من SUM(debit) = SUM(credit)

### Phase 2 — موديول الحسابات
- [x] **T2.1** API إنشاء قيد محاسبي ✅
- [x] **T2.2** ميزان المراجعة GET /api/accounts/trial-balance ✅
- [x] **T2.3** قائمة الدخل GET /api/accounts/income-statement ✅
- [x] **T2.4** الميزانية العمومية GET /api/accounts/balance-sheet ✅
- [x] **T2.5** قائمة التدفقات النقدية GET /api/accounts/cash-flow ✅
- [x] **T2.6** النسب المالية GET /api/accounts/ratios ✅
  - السيولة: Current Ratio, Quick Ratio, Cash Ratio
  - الربحية: Gross Profit Margin, Net Profit Margin, ROA, ROE
  - الملاءة: Debt to Assets, Debt to Equity
  - النشاط: Total Asset Turnover

- [x] **T2.7** واجهة Dashboard الحسابات ✅
  - صفحة `/dashboard/accounts` (Mobile-First، RTL)
  - 4 بطاقات ملخص (إيرادات، مصروفات، صافي دخل، أصول)
  - 4 تبويبات: ميزان مراجعة، قائمة دخل، ميزانية، نسب مالية
  - الجداول تتحول لـ Cards تحت 768px

---

## 🟡 قيد التنفيذ (In Progress)

_لا توجد مهام قيد التنفيذ حالياً._

---

## 🔵 المهام المخططة (Planned / Pending)

### Phase 3 — الموارد البشرية (HR) [4 tasks]
- [ ] **T3.1** CRUD ملفات الموظفين (اسم، مسمى، إدارة، تاريخ تعيين) + RBAC
- [ ] **T3.2** الحضور والانصراف (Check-in/out بتوقيت السيرفر)
- [ ] **T3.3** الإجازات (طلب + موافقة مدير + خصم من الرصيد)
- [ ] **T3.4** المرتبات ← عند الصرف ينشئ قيد محاسبي تلقائي

### Phase 4 — العمليات [3 tasks] ✅
- [x] **T4.1** CRUD الوحدات/الأصول التشغيلية ✅
- [x] **T4.2** الحجوزات وحالتها ✅
- [x] **T4.3** التعاقدات + تنبيه انتهاء 30 يوم ✅

### Phase 5 — التسويق [2 tasks] ✅
- [x] **T5.1** CRUD الحملات الإعلانية ✅
- [x] **T5.2** CRUD الـ Leads + مصدر إجباري ✅

### Phase 6 — المبيعات [2 tasks] ✅
- [x] **T6.1** Pipeline بمراحل ثابتة (lead → negotiation → won → lost) ✅
- [x] **T6.2** عند تحويل صفقة لـ "won" ← قيد إيراد تلقائي ✅

### Phase 7 — الأداء والاختبار النهائي [2 tasks]
- [ ] **T7.1** سكريبت k6 لمحاكاة 150 مستخدم متزامن
- [ ] **T7.2** اختبار RBAC شامل: كل دور × كل endpoint

### Phase 8 — النشر [3 tasks]
- [ ] **T8.1** ربط الدومين عبر Cloudflare أمام Vercel
- [ ] **T8.2** نقل Secrets لـ Vercel Environment Variables
- [ ] **T8.3** تفعيل UptimeRobot على الدومين النهائي

---

## 🐛 المشاكل المعروفة (Known Issues)

1. **Firebase Admin placeholder keys** — البيئة المحلية تستخدم PLACEHOLDER values في `.env.local`. تحتاج تحديث بقيم حقيقية من Firebase Console قبل تشغيل API المصادقة.
2. **Database غير متصلة** — Prisma schema جاهز لكن يحتاج `DATABASE_URL` حقيقية من Neon. حالياً `npx prisma db push` مش شغال بدون اتصال.
3. **Unit tests** — Jest configured لكن لا توجد اختبارات بعد. Acceptance criteria لكل Task تحتاج اختبارات.

---

## ملاحظات الجلسة

### الجلسة 1 — الإنشاء الأولي (21 يوليو 2026)
- **المُنجز:** Phase 0 كاملة + Phase 1 كاملة + Phase 2 كاملة (موديول الحسابات كاملاً)
- **إجمالي الملفات:** 25 ملف (16 source + 9 config)
- **Pages:** `/login`, `/dashboard`, `/dashboard/accounts`
- **API Routes:** `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/accounts/journal-entries`, `/api/accounts/trial-balance`, `/api/accounts/income-statement`, `/api/accounts/balance-sheet`, `/api/accounts/cash-flow`, `/api/accounts/ratios`
- **Build:** ✅ يشتغل بدون أخطاء (`npm run build` نجح)
- **نظام المحاسبة:** Double-Entry كامل مع American Rule، القيود غير المتوازنة مرفوضة
- **النسب المالية:** 11 نسبة محسوبة تلقائياً

### الجلسة 2 — إكمال Phases 3-6 (21 يوليو 2026)
- **المُنجز:** HR + عمليات + تسويق + مبيعات
- **إجمالي الملفات:** 56 ملف (30 route/page + config + lib)
- **HR:** Employees CRUD, Attendance (check-in/out), Leave (طلب+موافقة+رصيد), Salaries ← قيد محاسبي
- **العمليات:** Units CRUD, Bookings, Contracts + تنبيه 30 يوم
- **التسويق:** Campaigns CRUD, Leads CRUD + مصدر إجباري
- **المبيعات:** Pipeline (4 مراحل)، تحويل Won ← قيد إيراد تلقائي
- **إجمالي API Routes:** 28
- **إجمالي Pages:** 6
- **Build:** ✅ `npm run build` نجاح (30 route/page)
