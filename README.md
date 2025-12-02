# FamilyNotify 🔔

פלטפורמה מתקדמת למשפחה גדולה לשליחת הודעות, שמחות ואירועים לכולם, עם בחירת ערוץ קבלה אישי (Email / SMS / WhatsApp / Push-Web).

## 🎯 תכונות עיקריות

- **ערוצי תקשורת מרובים**: Email, SMS, WhatsApp, Web Push
- **קבוצות משפחתיות**: ניהול מספר משפחות עם הרשאות
- **לוח אירועים**: תזכורות אוטומטיות לימי הולדת ואירועים
- **הודעות מתוזמנות**: שליחה מיידית או תזמון לעתיד
- **העדפות אישיות**: כל משתמש בוחר איך לקבל הודעות
- **חינמי ל-MVP**: Email + Web Push פעילים, SMS/WhatsApp מוכנים

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Supabase (Postgres + Auth)
- **ORM**: Prisma
- **Email**: Resend
- **Push**: Web Push (VAPID)
- **SMS/WhatsApp**: Twilio / WhatsApp Cloud API (adapters מוכנים)
- **Deployment**: Vercel + Supabase

## 📋 דרישות מקדימות

- Node.js 18+
- Yarn או npm
- חשבון Supabase (חינמי)
- מפתח Resend API (חינמי)

## 🚀 התקנה והפעלה

### 1. Clone והתקנת Dependencies

\`\`\`bash
git clone <repository-url>
cd family-notify
yarn install
\`\`\`

### 2. הגדרת Supabase

1. צרו פרויקט חדש ב-[Supabase](https://supabase.com)
2. העתיקו את ה-URL ואת המפתחות מ-Settings > API
3. העתיקו את ה-Database URL מ-Settings > Database

### 3. הגדרת Resend

1. צרו חשבון ב-[Resend](https://resend.com)
2. צרו API Key חדש
3. הגדירו דומיין (או השתמשו ב-sandbox)

### 4. הגדרת משתני סביבה

צרו קובץ \`.env.local\` בשורש הפרויקט (ראו \`env.example.txt\`):

\`\`\`bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# Email (Resend)
RESEND_API_KEY="re_[YOUR-KEY]"
RESEND_FROM_EMAIL="FamilyNotify <noreply@yourdomain.com>"

# Web Push (auto-generated on first run)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""

# Cron Secret
CRON_SECRET="your-random-secret-string"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
\`\`\`

### 5. הגדרת Database

\`\`\`bash
# Generate Prisma Client
yarn prisma:generate

# Run migrations
yarn prisma:migrate

# Seed with demo data
yarn prisma:seed
\`\`\`

### 6. הרצת האפליקציה

\`\`\`bash
yarn dev
\`\`\`

פתחו בדפדפן: [http://localhost:3000](http://localhost:3000)

## 📊 מבנה הפרויקט

\`\`\`
family-notify/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── admin/         # Admin APIs
│   │   ├── dispatch/      # Dispatch APIs
│   │   └── cron/          # Cron jobs
│   ├── admin/             # Admin pages
│   ├── events/            # Events page
│   ├── feed/              # Feed page
│   ├── onboarding/        # Onboarding flow
│   ├── preferences/       # User preferences
│   ├── layout.tsx
│   └── page.tsx           # Landing page
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── providers/         # Email, SMS, Push, WhatsApp
│   ├── dispatch/          # Dispatch service
│   ├── supabase/          # Supabase client
│   └── prisma.ts
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── hooks/                 # Custom React hooks
├── vercel.json            # Vercel config + cron
└── package.json
\`\`\`

## 🔐 Authentication & Security

### Supabase Auth
המערכת משתמשת ב-Supabase Auth ל-magic links ו-OTP.

### Row Level Security (RLS)
כל הטבלאות מוגנות עם RLS policies:

\`\`\`sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Members can view group announcements
CREATE POLICY "Members view group announcements"
  ON announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE user_id = auth.uid()
      AND family_group_id = announcements.family_group_id
    )
  );

-- Only admins/editors can create announcements
CREATE POLICY "Admins create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE user_id = auth.uid()
      AND family_group_id = announcements.family_group_id
      AND role IN ('ADMIN', 'EDITOR')
    )
  );
\`\`\`

## 📬 שירותי שליחה

### Email (Resend) ✅ פעיל
- Developer plan חינמי: 100 emails/day
- אימות דומיין או sandbox

### Web Push (VAPID) ✅ פעיל
- מפתחות VAPID נוצרים אוטומטית בהרצה ראשונה
- נשמרים ב-\`vapid-keys.json\`

### SMS (Twilio) ⚙️ Stub
להפעלה:
1. צרו חשבון ב-[Twilio](https://twilio.com)
2. הוסיפו ל-\`.env.local\`:
\`\`\`
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"
\`\`\`

### WhatsApp (Cloud API) ⚙️ Stub
להפעלה:
1. צרו Business Account ב-[Meta for Developers](https://developers.facebook.com)
2. הוסיפו ל-\`.env.local\`:
\`\`\`
WHATSAPP_PHONE_NUMBER_ID="your-id"
WHATSAPP_ACCESS_TOKEN="your-token"
WHATSAPP_BUSINESS_ACCOUNT_ID="your-account-id"
\`\`\`

## ⏰ Cron Jobs

הגדרנו 2 cron jobs ב-\`vercel.json\`:

1. **Due Announcements** (כל 5 דקות)
   - בודק הודעות מתוזמנות שזמנן הגיע
   - שולח ומעדכן status

2. **Event Reminders** (כל 10 דקות)
   - בודק אירועים קרובים
   - שולח תזכורות לפי offsets מוגדרים

## 🎨 UI/UX

- **RTL Support**: תמיכה מלאה בעברית
- **Dark Mode**: מצב כהה/בהיר
- **Mobile-First**: מותאם לנייד
- **PWA Ready**: ניתן להתקנה
- **Accessibility**: נגישות בסיסית

## 🧪 Testing

הפרויקט כולל מערכת בדיקות מקיפה עם 87+ בדיקות פעילות!

### הרצת בדיקות

\`\`\`bash
# בדיקות יחידה ואינטגרציה (Jest)
npm test              # מצב watch
npm run test:ci       # פעם אחת + coverage

# בדיקות E2E (Playwright)
npm run test:e2e      # הרצת כל בדיקות E2E
npm run test:e2e:ui   # מצב UI אינטראקטיבי

# בדיקות נוספות
npm run lint          # ESLint
npm run type-check    # TypeScript
\`\`\`

### כיסוי הבדיקות

- ✅ **26 בדיקות יחידה** - Utils, Auth Helpers, Dispatch Service
- ✅ **19 בדיקות Providers** - Email, SMS, WhatsApp, Push
- ✅ **13 בדיקות API** - Announcements, Events
- ✅ **29 בדיקות קומפוננטות** - React Components
- ✅ **24 בדיקות E2E** - תהליכי משתמש מלאים

**סה"כ: 87+ בדיקות פעילות | כיסוי מינימלי: 70%**

ראה [TESTING.md](./TESTING.md) למדריך מפורט ו-[TEST_COVERAGE.md](./TEST_COVERAGE.md) לסיכום כיסוי.

### CI/CD

כל הבדיקות רצות אוטומטית ב-GitHub Actions:
- ✅ Jest tests + coverage report
- ✅ Playwright E2E tests
- ✅ TypeScript type checking
- ✅ ESLint
- ✅ דוחות אוטומטיים ל-Codecov

## 🚀 Deployment

### Vercel

1. Push לגיט:
\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

2. חברו את Vercel:
   - לכו ל-[Vercel Dashboard](https://vercel.com)
   - Import Git Repository
   - הוסיפו את משתני הסביבה
   - Deploy!

3. הגדירו את \`NEXT_PUBLIC_APP_URL\` ל-URL הסופי

### Supabase Edge Functions (אופציונלי)

ניתן להריץ background jobs דרך Supabase Edge Functions במקום Vercel Cron.

## 📝 מודל נתונים

### מודלים עיקריים:

- **User**: משתמשים (מסונכרן עם Supabase Auth)
- **FamilyGroup**: קבוצות משפחתיות
- **Membership**: חברות בקבוצות (עם תפקידים)
- **Preference**: העדפות ערוצי קבלה
- **Announcement**: הודעות ושמחות
- **Event**: אירועים עם תזכורות
- **DeliveryAttempt**: מעקב אחר שליחות
- **Topic**: נושאים לסינון
- **Consent**: תקנון ופרטיות

## 🤝 תרומה

פתוח לתרומות! פתחו Issue או PR.

## 📄 License

MIT License

## 💬 תמיכה

לשאלות ותמיכה: [your-email@example.com]

---

**Built with ❤️ for families**


