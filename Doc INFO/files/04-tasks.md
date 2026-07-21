# SYRIX — Tasks (خطة تنفيذ مرحلية)

> كل Task مستقلة بذاتها. اديها لموديل واحدة في المرة مع `01-constitution.md`. لا تدي الملف كله دفعة واحدة.

## Phase 0 — تهيئة المشروع والبنية التحتية

**T0.1 — إنشاء المشروع**
- أنشئ مشروع Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- أضف Prisma وهيّئ الاتصال بـ Neon (متغير `DATABASE_URL` في `.env`).
- **Acceptance:** `npm run dev` يشتغل بدون أخطاء، وصفحة رئيسية فاضية تظهر.

**T0.2 — ربط Firebase Auth**
- فعّل Firebase Authentication (Email/Password).
- أنشئ صفحة تسجيل دخول واحدة تستخدم Firebase SDK وتحفظ الـ JWT في Cookie (httpOnly).
- **Acceptance:** تسجيل دخول ناجح يحوّل المستخدم لصفحة `/dashboard`، وفاشل يظهر رسالة خطأ.

**T0.3 — إعداد Upstash Redis**
- أضف `@upstash/redis` و`@upstash/ratelimit`.
- طبّق Rate Limiting على `/api/auth/login` (5 محاولات/دقيقة لكل IP).
- **Acceptance:** المحاولة السادسة خلال دقيقة تُرجع `429 Too Many Requests`.

**T0.4 — Middleware للصلاحيات (RBAC)**
- أنشئ middleware يفحص JWT + دور المستخدم قبل أي API route تحت `/api/`.
- **Acceptance:** طلب API بدون توكن صالح يُرجع `401`، وطلب لبيانات إدارة تانية يُرجع `403`.

**T0.5 — CI/CD**
- أنشئ GitHub Action تشغّل `npm test` و`npm run build` على كل Pull Request.
- **Acceptance:** أي PR فيه اختبار فاشل لا يقدر يُدمج (Merge محظور).

## Phase 1 — قاعدة البيانات الأساسية

**T1.1 — Schema المستخدمين والإدارات**
- جداول: `users`, `departments`, `roles` (حسب الأدوار في `02-spec.md` قسم 2).
- **Acceptance:** Migration تنجح، وبيانات تجريبية (Seed) لـ 3 إدارات و5 مستخدمين تُدرج بنجاح.

**T1.2 — Schema الحسابات (الأهم)**
- جداول: `acc_chart_of_accounts` (دليل الحسابات من `02-spec.md` قسم 3.3-أ)، `acc_journal_entries`, `acc_journal_lines`.
- قيد على مستوى الـ Database Transaction: أي إدراج في `acc_journal_entries` بدون `acc_journal_lines` متوازنة (SUM(debit) = SUM(credit)) يُرفض بالكامل (Rollback).
- **Acceptance:** محاولة إدراج قيد غير متوازن تفشل مع رسالة خطأ واضحة؛ قيد متوازن ينجح.

## Phase 2 — موديول الحسابات (Accounts) — الأولوية القصوى

**T2.1 — API إنشاء قيد محاسبي**
- Endpoint: `POST /api/accounts/journal-entries`
- المدخلات: تاريخ، وصف، قائمة بنود (كل بند: `account_id`, `debit`, `credit`).
- تحقق: مجموع Debit = مجموع Credit، وإلا `400 Bad Request`.
- **Acceptance:** اختبار Unit يغطي حالة متوازنة وحالة غير متوازنة.

**T2.2 — ميزان المراجعة (Trial Balance)**
- Endpoint: `GET /api/accounts/trial-balance?period=YYYY-MM`
- يرجع كل حساب برصيده (مدين/دائن) حسب طبيعته (راجع American Rule في `02-spec.md`).
- **Acceptance:** إجمالي عمود المدين = إجمالي عمود الدائن في الـ Response.

**T2.3 — قائمة الدخل (Income Statement)**
- Endpoint: `GET /api/accounts/income-statement?period=YYYY-MM`
- يطبّق المعادلة بالترتيب المذكور في `02-spec.md` قسم 3.3-د.
- **Acceptance:** اختبار بقيم وهمية يطابق الناتج المتوقع يدويًا.

**T2.4 — الميزانية العمومية (Balance Sheet)**
- Endpoint: `GET /api/accounts/balance-sheet?date=YYYY-MM-DD`
- يتحقق: الأصول = الالتزامات + حقوق الملكية (وإلا Warning في الـ Response، مش رفض — بيانات تاريخية ممكن يكون فيها خطأ قديم).
- **Acceptance:** اختبار يطابق معادلة الميزانية بقيم متوازنة.

**T2.5 — قائمة التدفقات النقدية**
- Endpoint: `GET /api/accounts/cash-flow?period=YYYY-MM`
- تصنيف تلقائي: تشغيلية/استثمارية/تمويلية حسب نوع الحساب المرتبط بكل قيد.
- **Acceptance:** صافي التغير في النقدية = النقدية آخر المدة − أول المدة.

**T2.6 — النسب المالية**
- Endpoint: `GET /api/accounts/ratios?period=YYYY-MM`
- يحسب كل النسب المذكورة في `02-spec.md` قسم 3.3-ح (سيولة/ربحية/ملاءة/نشاط).
- **Acceptance:** كل نسبة تُحسب بمعادلتها الصحيحة (اختبار Unit منفصل لكل نسبة).

**T2.7 — واجهة Dashboard الحسابات**
- صفحة Responsive (Mobile-First) تعرض: ميزان المراجعة، قائمة الدخل، النسب المالية كـ Cards.
- الجداول تتحول لـ Cards تحت 768px (راجع Constitution بند 6).
- **Acceptance:** اختبار Responsive يدوي على 360/768/1200px بدون Overflow.

## Phase 3 — موديول الموارد البشرية (HR)
**T3.1** — CRUD ملفات الموظفين (اسم، مسمى، إدارة، تاريخ تعيين). Acceptance: صلاحيات RBAC تمنع موظف من تعديل بيانات غير بياناته.
**T3.2** — الحضور والانصراف (Check-in/out بتوقيت السيرفر). Acceptance: لا يمكن تسجيل Check-in ثاني قبل Check-out.
**T3.3** — الإجازات (طلب + موافقة مدير + خصم من الرصيد). Acceptance: الطلب يُرفض لو الرصيد المتبقي أقل من الأيام المطلوبة.
**T3.4** — المرتبات → عند "صرف" مرتب، يُنشأ قيد محاسبي تلقائي (`Dr. Salaries Expense / Cr. Bank`) عبر استدعاء T2.1. Acceptance: صرف مرتب واحد ينتج قيد واحد متوازن في `acc_journal_entries`.

## Phase 4 — موديول العمليات
**T4.1** — CRUD الوحدات/الأصول التشغيلية. **T4.2** — الحجوزات وحالتها. **T4.3** — التعاقدات + تنبيه قبل الانتهاء بـ 30 يوم (عبر QStash Cron).

## Phase 5 — موديول التسويق
**T5.1** — CRUD الحملات. **T5.2** — CRUD الـ Leads + مصدر العميل. Acceptance: كل Lead لازم يكون له `source` إجباري.

## Phase 6 — موديول المبيعات
**T6.1** — Pipeline بمراحل ثابتة (Enum: lead → negotiation → won → lost). **T6.2** — عند تحويل صفقة لـ "won"، يُنشأ قيد إيراد تلقائي (`Dr. Bank/AR / Cr. Sales Revenue`) عبر T2.1.

## Phase 7 — الأداء والاختبار النهائي
**T7.1** — سكريبت k6 لمحاكاة 150 مستخدم متزامن على أهم 5 endpoints. Acceptance: 95% من الطلبات < 500ms.
**T7.2** — اختبار RBAC شامل: كل دور × كل endpoint. Acceptance: مصفوفة نتائج كاملة بدون أي تسريب صلاحيات.

## Phase 8 — النشر
**T8.1** — ربط الدومين عبر Cloudflare أمام Vercel. **T8.2** — نقل كل الـ Secrets لـ Vercel Environment Variables (Production). **T8.3** — تفعيل UptimeRobot على الدومين النهائي.
