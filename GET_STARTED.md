# 🚀 בואו נתחיל!

## ✅ מה יש לנו?

הפרויקט FamilyNotify **מוכן לשימוש**! כל הקוד נכתב ומתועד.

**~80 קבצים | ~8,000 שורות קוד | תיעוד מקיף**

---

## 📦 התקנה מהירה (5 דקות)

### שלב 1: התקן Dependencies

```bash
cd "Family Notify"
yarn install
```

זה יתקין את כל ה-packages (עשוי לקחת 1-2 דקות).

### שלב 2: הגדר משתני סביבה

צור קובץ `.env.local` בשורש הפרויקט:

```bash
cp env.example.txt .env.local
```

ערוך את `.env.local` והוסף:

#### חובה (Minimum Viable):
```bash
DATABASE_URL="postgresql://..."  # מ-Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
RESEND_API_KEY="re_..."  # מ-Resend
RESEND_FROM_EMAIL="FamilyNotify <onboarding@resend.dev>"
CRON_SECRET="any-random-string-123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**איפה להשיג?**
- **Supabase**: [supabase.com](https://supabase.com) → Create project → Settings → API
- **Resend**: [resend.com](https://resend.com) → Sign up → API Keys → Create

### שלב 3: הגדר Database

```bash
# יצירת Prisma Client
yarn prisma:generate

# העלאת הסכימה ל-Supabase
yarn prisma:push

# הוספת נתוני דמו
yarn prisma:seed
```

### שלב 4: הרץ! 🎉

```bash
yarn dev
```

פתח בדפדפן: **http://localhost:3000**

---

## 🎯 מה עכשיו?

### ✅ כבר עובד:
1. דף נחיתה מעוצב
2. תהליך הרשמה (Onboarding)
3. ניהול העדפות קבלה
4. פיד הודעות
5. לוח אירועים
6. ממשק ניהול (Admin)
7. שליחת Email (Resend)
8. Web Push notifications

### 🛠️ צריך להגדיר (אופציונלי):
- **SMS**: הוסף Twilio credentials ל-`.env.local`
- **WhatsApp**: הוסף WhatsApp Cloud API credentials
- **RLS Policies**: הרץ policies מ-`docs/RLS_POLICIES.md` ב-Supabase SQL Editor

---

## 📚 תיעוד

כל מה שצריך:

| קובץ | תיאור |
|------|-------|
| `README.md` | תיעוד מלא של הפרויקט |
| `QUICKSTART.md` | התחלה מהירה (הכי חשוב!) |
| `docs/DEPLOYMENT.md` | איך לעלות ל-production |
| `docs/RLS_POLICIES.md` | מדיניות אבטחה |
| `docs/API.md` | תיעוד API |
| `docs/FEATURES.md` | רשימת תכונות |
| `CONTRIBUTING.md` | איך לתרום |
| `SECURITY.md` | מדיניות אבטחה |
| `PROJECT_SUMMARY.md` | סיכום הפרויקט |

---

## 🎓 Tutorial מהיר

### 1. צור קבוצה משפחתית

```
http://localhost:3000/onboarding
```
- הכנס אימייל
- בחר "צור קבוצה חדשה"
- תן שם לקבוצה

### 2. הגדר העדפות

```
http://localhost:3000/preferences
```
- הפעל Email
- הפעל Web Push
- אמת את היעדים

### 3. שלח הודעה ראשונה

```
http://localhost:3000/admin
```
- לחץ "הודעה חדשה"
- כתוב כותרת ותוכן
- בחר "שלח עכשיו"

### 4. ראה את ההודעה

```
http://localhost:3000/feed
```
- ההודעה תופיע בפיד
- בדוק את האימייל שהתקבל

---

## 🚀 Deploy ל-Production

מוכן לעלות לאוויר?

### Option 1: Vercel (מומלץ)

```bash
# 1. Push לגיט
git init
git add .
git commit -m "Initial commit - FamilyNotify"
git push

# 2. חבר Vercel
# לך ל-vercel.com → Import Project

# 3. הוסף environment variables
# העתק את כל המשתנים מ-.env.local

# 4. Deploy!
```

ראה `docs/DEPLOYMENT.md` להוראות מפורטות.

---

## 🐛 פתרון בעיות

### "Cannot connect to database"
- ודא שה-`DATABASE_URL` נכון
- בדוק שה-database נגיש מ-internet

### "Email not sending"
- בדוק את ה-`RESEND_API_KEY`
- ודא שהשימוש ב-sandbox domain (`onboarding@resend.dev`)

### "Module not found"
```bash
rm -rf node_modules
yarn install
```

### "Prisma Client is not generated"
```bash
yarn prisma:generate
```

---

## 💡 טיפים

### Development
- השתמש ב-`yarn dev` להפעלה מקומית
- `yarn lint` לבדיקת קוד
- `yarn type-check` לבדיקת טיפוסים
- `yarn format` לפורמט קוד

### Database
- `yarn prisma:studio` לממשק גרפי
- `yarn prisma:push` לעדכון סכימה
- `yarn prisma:seed` לנתוני דמו

### Security
- **אל תעלו** `.env.local` לגיט!
- הריצו RLS policies לפני production
- שמרו את ה-Service Role Key בסוד

---

## 🎉 זהו!

הפרויקט **מוכן לשימוש מיידי**.

### מה הלאה?

1. ✅ **Development**: הרץ `yarn dev` ונסה
2. ✅ **Customize**: התאם לצרכים שלך
3. ✅ **Deploy**: העלה ל-Vercel
4. ✅ **Share**: הזמן משתמשים!

---

## 🆘 עזרה

**יש בעיה?**
- קרא את `QUICKSTART.md`
- בדוק את `docs/`
- פתח Issue ב-GitHub

**רוצה לתרום?**
- קרא את `CONTRIBUTING.md`
- בחר issue
- שלח PR!

---

## 📞 Contact

- 📧 Email: support@familynotify.com
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

**Happy Coding! 🚀**

Built with ❤️ for families everywhere

