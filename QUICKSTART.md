# ⚡ Quick Start Guide

הדרך המהירה ביותר להתחיל עם FamilyNotify!

## 📦 התקנה מהירה (5 דקות)

### 1. Clone & Install

\`\`\`bash
cd "Family Notify"
yarn install
\`\`\`

### 2. הגדרת Supabase (2 דקות)

1. צרו פרויקט חדש ב-[supabase.com](https://supabase.com) (חינמי!)
2. העתיקו את המפתחות מ-Settings > API
3. העתיקו את ה-Database URL מ-Settings > Database > Connection string

### 3. הגדרת Resend (1 דקה)

1. צרו חשבון ב-[resend.com](https://resend.com) (חינמי!)
2. צרו API Key
3. השתמשו ב-\`onboarding@resend.dev\` למייל sandbox

### 4. צרו קובץ .env.local

\`\`\`bash
# Copy the example
cp env.example.txt .env.local
\`\`\`

ערכו את \`.env.local\` עם הערכים שלכם:

\`\`\`bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-KEY]"
RESEND_API_KEY="re_[YOUR-KEY]"
RESEND_FROM_EMAIL="FamilyNotify <onboarding@resend.dev>"
CRON_SECRET="my-secret-123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### 5. הגדרת Database

\`\`\`bash
# Generate Prisma client
yarn prisma:generate

# Push schema to database
yarn prisma db push

# Seed with demo data
yarn prisma:seed
\`\`\`

### 6. הרצה! 🚀

\`\`\`bash
yarn dev
\`\`\`

פתחו: [http://localhost:3000](http://localhost:3000)

---

## 🎯 מה עשוי?

### ✅ פועל מהקופסה:
- דף נחיתה מעוצב
- תהליך onboarding
- ניהול העדפות קבלה
- פיד הודעות
- לוח אירועים
- ממשק ניהול (Admin)
- שליחת Email (דרך Resend)
- Web Push notifications
- API Routes מלאים
- Cron jobs מוכנים

### ⚙️ מוכן אך כבוי (צריך credentials):
- SMS (Twilio)
- WhatsApp (Cloud API)

---

## 📱 בדיקה מהירה

### 1. גלשו להודעות
\`http://localhost:3000/feed\`

### 2. צרו הודעה חדשה
\`http://localhost:3000/admin\`

### 3. בדקו שנשלח Email
בדקו את ה-console או Resend dashboard

---

## 🔒 RLS Setup (חובה!)

לפני production, הריצו את ה-RLS policies:

1. התחברו ל-Supabase Dashboard
2. SQL Editor
3. העתיקו והריצו את הפקודות מ-\`docs/RLS_POLICIES.md\`

---

## 🐛 פתרון בעיות נפוצות

### Database connection failed
- ודאו שה-DATABASE_URL נכון
- בדקו שה-Database נגיש מ-internet (Supabase default: כן)

### Prisma generate failed
\`\`\`bash
rm -rf node_modules
yarn install
yarn prisma:generate
\`\`\`

### Email לא נשלח
- בדקו שה-RESEND_API_KEY תקין
- בדקו Resend Logs בדשבורד
- ודאו ש-\`RESEND_FROM_EMAIL\` מכיל sandbox domain או מאומת

### Port 3000 תפוס
\`\`\`bash
yarn dev -p 3001
\`\`\`

---

## 📚 המשך קריאה

- [README.md](README.md) - תיעוד מלא
- [docs/RLS_POLICIES.md](docs/RLS_POLICIES.md) - מדיניות אבטחה
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - מדריך deployment

---

## 🎉 זהו! אתם מוכנים!

עכשיו תוכלו:
- ליצור קבוצות משפחתיות
- לפרסם הודעות ואירועים
- לשלוח התראות בערוצים שונים
- לנהל העדפות משתמשים

**נהנים? כוכב ⭐ ב-GitHub יעזור!**



