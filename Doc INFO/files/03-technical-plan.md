# SYRIX — Technical Plan (الخطة التقنية والمعمارية)

## 0. توفيق أساسي: Vercel + Firebase مع PostgreSQL/Redis

طلبك الأصلي فيه تعارض بسيط: Vercel وFirebase Hosting بيئات **Serverless** (بتشغّل الكود لحظيًا وتقفله)، بينما Redis وPostgreSQL التقليديين محتاجين **اتصال دائم (Persistent Connection)**. الحل المستخدم فعليًا في مشاريع زي دي:

| الاحتياج الأصلي | البديل المستخدم فعليًا | ليه |
|---|---|---|
| Frontend (HTML/JS أو Vue/React) | **Next.js** على **Vercel** | يدعم React، Server-Side Rendering، ونشر مباشر بضغطة واحدة، ومجاني على المستوى الأساسي |
| Firebase Hosting | يُستخدم لـ **Authentication + Storage** فقط (مش Hosting) | لأن الـ Frontend الأساسي هيبقى على Vercel، وFirebase Auth جاهز وآمن وسريع التنفيذ |
| PostgreSQL/MySQL | **Neon** (Postgres serverless) أو **Supabase** | بيدعم Serverless Connections (HTTP-based) بدل الاتصال التقليدي، ومجاني حتى حجم معقول |
| Redis | **Upstash Redis** (serverless, REST-based) | نفس فكرة Neon بس لـ Redis، ومتوافق 100% مع Vercel |
| Queue (Bull/Redis) | **Upstash QStash** أو **Vercel Cron Jobs** | Bull التقليدي محتاج سيرفر دائم، QStash بديل serverless مباشر |
| Backend (Node/Laravel) | **Next.js API Routes** (Node.js) على نفس مشروع Vercel | يوحّد الـ Deployment في مكان واحد، ويقلل التعقيد لموديل تنفيذي رخيص |

**القرار النهائي المعتمد:** Next.js (Frontend + API Routes) → Vercel | Firebase (Auth + Storage) | Neon (Postgres) | Upstash (Redis + Queue).

## 1. Stack التفصيلي المعتمد

| الطبقة | التقنية |
|---|---|
| Frontend | Next.js 14+ (App Router) + Tailwind CSS |
| State/Data Fetching | React Query (TanStack Query) |
| Backend API | Next.js API Routes / Route Handlers |
| Auth | Firebase Authentication (Email/Password + إمكانية SSO لاحقًا) |
| Database | PostgreSQL عبر Neon + Prisma ORM |
| Cache | Upstash Redis |
| Queue | Upstash QStash (تقارير، إيميلات) |
| File Storage | Firebase Storage (مستندات، صور الموظفين، مرفقات الفواتير) |
| Hosting | Vercel (Frontend + API) |
| CDN | Cloudflare (أمام Vercel، اختياري للتحكم في الدومين والـ DNS) |
| Monitoring | Vercel Analytics + UptimeRobot (مجاني) |
| CI/CD | GitHub Actions (بديل GitLab لأن التكامل مع Vercel أسهل) |

## 2. المعمارية العامة
```
[Browser: Mobile/Tablet/Desktop]
        │  (HTTPS)
        ▼
   [Cloudflare CDN]
        ▼
   [Vercel: Next.js Frontend + API Routes]
        │
        ├──► [Firebase Auth]  (تسجيل دخول/صلاحيات JWT)
        ├──► [Firebase Storage] (ملفات)
        ├──► [Neon PostgreSQL] (عبر Prisma) (البيانات الأساسية + الحسابات)
        └──► [Upstash Redis] (Cache + Rate Limiting + Sessions)
                └──► [Upstash QStash] (مهام مجدولة: تقارير، إيميلات)
```

## 3. قاعدة البيانات (تصميم عالي المستوى)
- **Schema واحد** في Neon، بجداول مقسّمة منطقيًا بـ prefix لكل موديول: `hr_*`, `ops_*`, `acc_*`, `mkt_*`, `sales_*`.
- موديول الحسابات (`acc_*`) هو الأكثر حساسية — لازم Foreign Keys صارمة و Transactions ذرية (Atomic) على كل قيد (لا يُسمح بحفظ طرف مدين بدون طرف دائن في نفس الـ DB Transaction).
- جدول مركزي: `acc_journal_entries` (رأس القيد) + `acc_journal_lines` (بنود مدين/دائن) — تصميم قياسي في أنظمة المحاسبة.
- Indexing إجباري على: `employee_id`, `department_id`, `created_at`, وأي عمود بحث متكرر (راجع بند الأداء).

## 4. الأداء وقابلية التوسع (Performance & Scalability)

### Frontend
- ضغط الصور WebP + `next/image` (Lazy Loading تلقائي).
- Minify/Bundle تلقائي عبر Next.js Build.
- Cloudflare CDN للملفات الثابتة.
- Cache-Control headers على الأصول الثابتة (Static Assets).

### Backend
- Upstash Redis لتخزين القوائم المتكررة (قوائم الوحدات، نتائج التقارير) بـ TTL مناسب (5-15 دقيقة حسب حساسية البيانات).
- **Pagination إجباري**: 25-50 صف كحد أقصى في أي API list endpoint (راجع Constitution بند 4).
- Prisma + Neon: تفعيل Indexing على أعمدة البحث + Connection Pooling عبر Neon's built-in pooler (PgBouncer-compatible).
- QStash للمهام الثقيلة (تقارير مالية شهرية، إرسال إيميلات جماعية) بدل تنفيذها Sync وقت الطلب.

### البنية
- Vercel بيعمل Auto-Scaling تلقائيًا (serverless functions) — مفيش حاجة اسمها Load Balancer يدوي مطلوبة هنا، وده فرق عن الافتراض الأصلي (Nginx) لأننا مش على سيرفر تقليدي.
- Rate Limiting عبر Upstash Redis (`@upstash/ratelimit`) على مستوى الـ API Routes الحساسة (Login، إنشاء قيود محاسبية).
- فصل منطقي بين الـ Frontend (Static/ISR pages) والـ API (Dynamic) عبر Next.js نفسه.

## 5. الاختبارات الإلزامية قبل الإطلاق
| الاختبار | الأداة | المعيار |
|---|---|---|
| Load Testing | k6 | محاكاة 100-200 مستخدم متزامن، Response time < 500ms لـ 95% من الطلبات |
| Responsive Testing | Chrome DevTools | 360px / 768px / 1200px+ بدون Overflow أو عناصر مقطوعة |
| RBAC Testing | Jest/Integration Tests | كل دور يفشل عند محاولة الوصول لبيانات إدارة تانية (403 Forbidden) |
| Accounting Integrity | Unit Tests | كل قيد غير متوازن (مدين ≠ دائن) يُرفض تلقائيًا |
| CI/CD | GitHub Actions | تشغيل كل الاختبارات فوق تلقائيًا قبل أي Merge لـ main |

## 6. خطوات التهيئة للنشر (Vercel + Firebase) — ملخص تنفيذي
1. إنشاء مشروع على Vercel وربطه بـ GitHub repo.
2. إنشاء مشروع Firebase → تفعيل Authentication + Storage فقط.
3. إنشاء قاعدة بيانات على Neon → نسخ Connection String لـ Vercel Environment Variables.
4. إنشاء حساب Upstash → إنشاء Redis Database + QStash → نسخ الـ Tokens لـ Vercel Environment Variables.
5. لا تُرفع أي مفتاح في الكود — كل شيء عبر Vercel Project Settings → Environment Variables (راجع Constitution بند 5).

تفاصيل كل خطوة كأوامر تنفيذية موجودة في `04-tasks.md` (Phase 0).
