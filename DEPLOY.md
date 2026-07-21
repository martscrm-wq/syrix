# SYRIX — دليل النشر (Deployment Guide)

> هذا الدليل يشرح خطوات النشر على Vercel + Firebase + Neon + Upstash.

---

## 1. المتطلبات الأساسية

| الخدمة | حساب مطلوب |
|--------|------------|
| Vercel | حساب مجاني على vercel.com |
| Firebase | مشروع على console.firebase.google.com |
| Neon | حساب مجاني على neon.tech |
| Upstash | حساب مجاني على upstash.com |
| GitHub | الـ Repo مرفوع على GitHub |

---

## 2. خطوات النشر

### 2.1 رفع الكود على GitHub
```bash
git remote add origin https://github.com/your-org/syrix.git
git branch -M main
git push -u origin main
```

### 2.2 إنشاء قاعدة البيانات على Neon
1. سجل دخول على https://neon.tech
2. أنشئ مشروع جديد → اختر region قريب
3. من Dashboard انسخ `DATABASE_URL` (Connection String)
4. شغّل الـ Migration:
```bash
npx prisma db push
npx prisma db seed
```

### 2.3 إعداد Firebase
1. اذهب إلى Firebase Console → أنشئ مشروع
2. فعّل **Authentication** → Email/Password
3. اذهب إلى **Project Settings** → Service Accounts
4. أنشئ **private key.json** جديد (Firebase Admin SDK)
5. انسخ: `project_id`, `client_email`, `private_key`

### 2.4 إعداد Upstash Redis
1. سجل في https://upstash.com
2. أنشئ Redis Database → انسخ `UPSTASH_REDIS_REST_URL` و `UPSTASH_REDIS_REST_TOKEN`
3. اذهب إلى QStash → أنشئ Token → انسخ الـ tokens

### 2.5 النشر على Vercel
```bash
npx vercel --prod
```

1. اربط GitHub repo
2. اضبط **Environment Variables** التالية في Vercel Dashboard:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | من Neon |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | من Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | من Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | من Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | من Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | من Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | من Firebase |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | من Firebase Admin |
| `FIREBASE_ADMIN_PRIVATE_KEY` | من Firebase Admin (انسخها كاملة مع \\n) |
| `UPSTASH_REDIS_REST_URL` | من Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | من Upstash |
| `QSTASH_TOKEN` | من Upstash QStash |
| `QSTASH_CURRENT_SIGNING_KEY` | من Upstash QStash |
| `QSTASH_NEXT_SIGNING_KEY` | من Upstash QStash |
| `NEXT_PUBLIC_APP_URL` | https://your-domain.vercel.app |

**هام:** `FIREBASE_ADMIN_PRIVATE_KEY` تحتاج أن تُنسخ مع `\\n` (backslash n) وليس سطور جديدة.

---

## 3. بعد النشر

### 3.1 تشغيل Seed Data
بعد أول نشر، شغّل:
```bash
npx vercel env pull
npx prisma db seed
```

أو عبر Vercel Dashboard → Project Settings → Run Command:
```bash
npx prisma db push && npx prisma db seed
```

### 3.2 ربط الدومين (Cloudflare)
1. أضف الدومين في Vercel Dashboard → Project → Domains
2. في Cloudflare:
   - أضف CNAME record: `@` → `cname.vercel-dns.com`
   - أو غيّر Nameservers لـ Vercel
3. فعّل Proxy (Orange Cloud) لحماية DNS

### 3.3 مراقبة UptimeRobot
1. سجل في https://uptimerobot.com
2. أضف Monitor جديد:
   - URL: `https://your-domain.com/api/auth/me`
   - Interval: 5 دقائق
   - Alert: إيميل عند انقطاع الخدمة

### 3.4 تفعيل CI/CD (بالفعل جاهز)
`.github/workflows/ci.yml` يشغّل تلقائياً:
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm test`

على كل Pull Request إلى `main`.

---

## 4. التحقق من النشر

| الاختبار | الطريقة |
|---------|---------|
| الصفحة الرئيسية | زيارة `https://your-domain.com` |
| API | `curl https://your-domain.com/api/auth/me` |
| Database | تشغيل `npx prisma studio` |
| Redis | اختبار Rate Limiting بـ 6 محاولات/login |
| Build | التحقق من GitHub Actions ✅ |

---

## 5. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Firebase private key error | تأكد من `FIREBASE_ADMIN_PRIVATE_KEY` فيها `\\n` |
| Prisma connection error | تأكد من `DATABASE_URL` صحيحة و Neon IP whitelist |
| 429 Too Many Requests | Rate limiting يعمل بشكل صحيح (يختفي بعد دقيقة) |
| Build failed | افحص GitHub Actions logs |

---

> تم بموجب `03-technical-plan.md` — Stack: Vercel + Firebase + Neon + Upstash
