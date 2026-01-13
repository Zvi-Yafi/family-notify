# 🚀 מדריך Deployment

## הכנה ל-Production

### 1. בדיקות לפני Deployment

\`\`\`bash
# Lint
yarn lint

# Type check
yarn tsc --noEmit

# Build test
yarn build
\`\`\`

### 2. משתני סביבה

ודאו שיש לכם את כל המשתנים הדרושים:

#### חובה (Required):
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

#### אופציונלי (Optional):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `GREEN_API_ID_INSTANCE`
- `GREEN_API_TOKEN_INSTANCE`

#### VAPID Keys:
- אופציה 1: הריצו את האפליקציה פעם אחת ל-generate
- אופציה 2: generate ידנית עם \`web-push generate-vapid-keys\`

### 3. הגדרת Green API (WhatsApp)

כדי להפעיל שליחת WhatsApp דרך Green API:

1. **הרשמה ב-Green API:**
   - גש ל-[Green API](https://green-api.com) והירשם
   - אשר את החשבון דרך הדוא"ל

2. **יצירת Instance:**
   - צור instance חדש בקונסול של Green API
   - בחר תוכנית מתאימה (יש תוכנית בחינם לבדיקות)

3. **אישור Instance:**
   - אשר את ה-instance על ידי סריקת QR code ב-WhatsApp
   - ודא שה-WhatsApp מחובר לאינטרנט

4. **קבלת פרמטרי גישה:**
   - מקונסול Green API, קבל:
     - `idInstance` - מזהה המופע
     - `apiTokenInstance` - אסימון הגישה

5. **הגדרת משתני סביבה:**
   - הוסף ל-`.env.local`:
     \`\`\`
     GREEN_API_ID_INSTANCE="your-id-instance"
     GREEN_API_TOKEN_INSTANCE="your-api-token-instance"
     \`\`\`
   - ב-production, הוסף את המשתנים ב-Vercel Environment Variables

**הערה:** הטלפון המחובר ל-instance צריך להיות טעון ומחובר לאינטרנט לשליחת וקבלת הודעות.

---

## Deployment ל-Vercel

### שלב 1: Push לגיט

\`\`\`bash
git init
git add .
git commit -m "Initial commit - FamilyNotify"
git branch -M main
git remote add origin [YOUR-REPO-URL]
git push -u origin main
\`\`\`

### שלב 2: חיבור ל-Vercel

1. לכו ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. לחצו "Add New Project"
3. Import Git Repository
4. בחרו את ה-repo שלכם

### שלב 3: הגדרת Environment Variables

בדף ההגדרות של הפרויקט ב-Vercel:

1. לכו ל-Settings > Environment Variables
2. הוסיפו את כל המשתנים מ-\`.env.local\`
3. ודאו שה-\`NEXT_PUBLIC_*\` משתנים זמינים גם ל-Preview

### שלב 4: Deploy!

לחצו "Deploy" - Vercel יבנה וידפלוי אוטומטית.

### שלב 5: הגדרת Domain (אופציונלי)

1. Settings > Domains
2. הוסיפו את הדומיין שלכם
3. עדכנו את \`NEXT_PUBLIC_APP_URL\` ל-domain החדש
4. עדכנו את \`RESEND_FROM_EMAIL\` אם צריך

---

## Deployment ל-Supabase

### Database Setup

\`\`\`bash
# Push schema to Supabase
npx prisma db push

# או עם migrations
npx prisma migrate deploy

# Seed data
npx prisma db seed
\`\`\`

### RLS Policies

1. התחברו ל-Supabase Dashboard
2. עברו ל-SQL Editor
3. הריצו את ה-policies מ-\`docs/RLS_POLICIES.md\`

### Edge Functions (אופציונלי)

אם תרצו להשתמש ב-Supabase Edge Functions במקום Vercel Cron:

\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref [YOUR-PROJECT-REF]

# Deploy functions
supabase functions deploy
\`\`\`

---

## Cron Jobs ב-Vercel

ה-Cron jobs מוגדרים ב-\`vercel.json\`:

1. **Due Announcements**: רץ כל 5 דקות
2. **Event Reminders**: רץ כל 10 דקות

### הגדרת CRON_SECRET

\`\`\`bash
# Generate secret
openssl rand -base64 32

# Add to Vercel environment variables
CRON_SECRET="[generated-secret]"
\`\`\`

### בדיקת Cron

\`\`\`bash
# Test locally (with secret in .env.local)
curl -H "Authorization: Bearer [CRON_SECRET]" \
  http://localhost:3000/api/cron/due-announcements

# Test production
curl -H "Authorization: Bearer [CRON_SECRET]" \
  https://your-domain.com/api/cron/due-announcements
\`\`\`

---

## Monitoring & Logs

### Vercel Logs

1. Dashboard > Project > Logs
2. בדקו errors ו-warnings
3. הגדירו Alerts (Settings > Integrations)

### Supabase Logs

1. Dashboard > Logs
2. בדקו Database, API, Auth logs
3. הגדירו Webhook notifications

### External Monitoring (אופציונלי)

- **Sentry**: Error tracking
- **PostHog**: Analytics
- **BetterStack**: Uptime monitoring

---

## Performance Optimization

### Next.js Optimizations

\`\`\`javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com'],
  },
  compress: true,
  poweredByHeader: false,
}
\`\`\`

### Database Optimizations

\`\`\`sql
-- Add indexes
CREATE INDEX idx_announcements_family_group 
  ON announcements(family_group_id, published_at DESC);

CREATE INDEX idx_events_starts_at 
  ON events(family_group_id, starts_at);

CREATE INDEX idx_delivery_attempts_status 
  ON delivery_attempts(status, created_at);
\`\`\`

### Prisma Connection Pooling

השתמשו ב-Prisma Data Proxy או Supabase Connection Pooler ל-serverless.

---

## Security Checklist

- [ ] RLS מופעל על כל הטבלאות
- [ ] Service Role Key לא נחשף בקליינט
- [ ] CRON_SECRET מוגדר
- [ ] HTTPS בלבד (Vercel default)
- [ ] Headers אבטחה ב-\`middleware.ts\`
- [ ] Rate limiting (עתידי)
- [ ] CSP headers (עתידי)

---

## Rollback

אם משהו לא עובד:

### Vercel

1. Dashboard > Deployments
2. בחרו deployment קודם
3. לחצו "..." > "Promote to Production"

### Database

\`\`\`bash
# Rollback migration
npx prisma migrate reset
npx prisma migrate deploy
\`\`\`

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**הערה**: זכרו לבדוק את הכל ב-Preview Deployment לפני production!



