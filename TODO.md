# רשימת משימות - Family Notify

## ✅ הושלם

### אימות וניהול משתמשים
- [x] התחברות עם אימייל וסיסמה
- [x] הרשמה עם אימייל
- [x] Middleware להגנה על routes
- [x] Sync משתמשים בין Supabase ל-Prisma
- [x] דף העדפות משתמש (תוקן לולאה אינסופית)

### קבוצות משפחתיות
- [x] יצירת קבוצה חדשה
- [x] הצטרפות לקבוצה קיימת
- [x] דף הקבוצות שלי
- [x] בחירת קבוצה פעילה (Context)
- [x] Group Selector Component

### הודעות ואירועים
- [x] יצירת הודעות (GENERAL / SIMCHA)
- [x] יצירת אירועים עם תזכורות
- [x] דף אירועים (עם סינון עבר/עתיד)
- [x] דף פיד הודעות
- [x] דף ניהול (Admin)

### תקשורת
- [x] שליחת אימייל (Resend)
- [x] Dispatch Service
- [x] העדפות ערוצים (EMAIL, SMS, WHATSAPP, PUSH)
- [x] מעקב אחרי משלוחים (delivery_attempts)

### UI/UX
- [x] Toast notifications במקום Error Overlay
- [x] טיפול בשגיאות עם הודעות ידידותיות
- [x] כפתורי CORS ל-API routes
- [x] Loading states

---

## ⚠️ דורש הגדרה

### התחברות עם Google
- [ ] **הגדר Google OAuth ב-Google Cloud Console**
  - צור OAuth Client ID
  - הוסף Authorized redirect URIs
  - העתק Client ID ו-Secret
- [ ] **הפעל Google Provider ב-Supabase Dashboard**
  - Authentication > Providers > Google
  - הזן Client ID ו-Secret
- [ ] **בדוק שההתחברות עובדת**

### שירותי SMS ו-WhatsApp (אופציונלי)
- [ ] **Twilio (SMS)**
  - צור חשבון ב-Twilio
  - קבל Account SID, Auth Token, Phone Number
  - הוסף למשתני סביבה
- [ ] **WhatsApp Business API**
  - הגדר WhatsApp Business Account
  - קבל Phone Number ID, Access Token
  - הוסף למשתני סביבה

---

## 🚀 להוסיף בעתיד (Nice to have)

### תכונות
- [ ] עריכת/מחיקת הודעות ואירועים
- [ ] תמונות/קבצים מצורפים להודעות
- [ ] סטטיסטיקות אמיתיות (במקום דמה)
- [ ] ניהול הרשאות (Admin/Editor/Member)
- [ ] מחיקת חברי קבוצה
- [ ] שינוי שם קבוצה
- [ ] תצוגת "נקרא" להודעות
- [ ] פילטר הודעות לפי סוג (GENERAL/SIMCHA)

### טכני
- [ ] Unit tests מקיפים יותר
- [ ] E2E tests ל-Google Auth
- [ ] Rate limiting ל-API
- [ ] Webhook ל-WhatsApp delivery status
- [ ] Push notifications אמיתיות (service worker)
- [ ] PWA support מלא
- [ ] Dark mode מלא

### פריסה
- [ ] הגדר Vercel deployment
- [ ] CI/CD pipeline
- [ ] Environment variables ב-Vercel
- [ ] Custom domain
- [ ] SSL certificates

---

## 📝 הערות

### משתני סביבה חובה
```bash
DATABASE_URL=              # Supabase Postgres
NEXT_PUBLIC_SUPABASE_URL=  # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=            # Email provider
CRON_SECRET=               # Secure cron endpoints
```

### משתני סביבה אופציונליים
```bash
TWILIO_ACCOUNT_SID=        # SMS
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
WHATSAPP_PHONE_NUMBER_ID=  # WhatsApp
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

---

## 🐛 בעיות שתוקנו היום

1. ✅ Error Overlay (מסך שחור) → Toast notifications
2. ✅ OPTIONS 405 על API routes → CORS handling
3. ✅ דף אירועים לא טוען → הוספת סינון עבר/עתיד
4. ✅ דף העדפות טעינה אינסופית → תיקון useCallback loop

---

**עודכן:** 3 דצמבר 2025

