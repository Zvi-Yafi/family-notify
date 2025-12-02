# Security Policy

## 🔒 Reporting a Vulnerability

אם מצאתם פגיעות אבטחה, אנא **אל תדווחו עליה ב-GitHub Issues הציבורי**.

במקום זאת, שלחו דוא"ל ל:
**security@familynotify.com**

### מה לכלול בדיווח:

1. תיאור הפגיעות
2. שלבים לשחזור
3. השפעה אפשרית
4. הצעות לתיקון (אופציונלי)

אנו מתחייבים:
- לאשר קבלת הדיווח תוך 48 שעות
- לספק עדכון על מצב החקירה תוך 7 ימים
- לתקן פגיעויות קריטיות תוך 30 יום

## 🛡️ Security Best Practices

### למפתחים:

#### 1. Environment Variables
- **לעולם** אל תעלו `.env` או `.env.local` לגיט
- השתמשו ב-`.env.example` לתיעוד
- Service Role Key **אסור** בצד הקליינט

#### 2. Database Security
- השתמשו ב-RLS (Row Level Security) על **כל** הטבלאות
- אימתו הרשאות לפני כל פעולה
- השתמשו ב-Prepared Statements (Prisma עושה זאת אוטומטית)
- הגבלת connection pool

#### 3. API Security
- אימות משתמש לפני כל פעולה
- Rate limiting על endpoints ציבוריים
- Input validation עם Zod
- Sanitization של HTML/JavaScript
- CORS מוגדר נכון

#### 4. Authentication
- Supabase Auth עם JWT
- Secure session management
- Password hashing (handled by Supabase)
- MFA support (עתידי)

#### 5. Sensitive Data
- אל תשמרו סיסמאות בקוד
- אל תלוגו sensitive data
- הצפינו נתונים רגישים בDB
- השתמשו ב-HTTPS בלבד

### למשתמשים:

#### 1. חשבון
- השתמשו בסיסמה חזקה
- אל תשתפו את הסיסמה
- התנתקו ממכשירים ציבוריים
- עדכנו סיסמה באופן תקופתי

#### 2. פרטיות
- בחרו בזהירות את ערוצי הקבלה
- אמתו מספרי טלפון ומיילים
- בדקו את הגדרות הפרטיות
- הסירו ערוצים שאינכם משתמשים בהם

#### 3. תוכן
- אל תשתפו מידע רגיש בהודעות
- היזהרו מקישורים חשודים
- דווחו על תוכן פוגעני
- אל תלחצו על קישורים לא מוכרים

## 🔐 Security Features

### Implemented

- ✅ Row Level Security (RLS)
- ✅ JWT Authentication
- ✅ HTTPS Only
- ✅ Security Headers
- ✅ Input Validation
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Rate Limiting (basic)

### Planned

- ⏳ Advanced Rate Limiting
- ⏳ MFA Support
- ⏳ IP Whitelisting
- ⏳ Audit Logs
- ⏳ Automated Security Scans
- ⏳ CAPTCHA on sensitive operations
- ⏳ Content Security Policy (CSP)

## 📋 Security Checklist

### Before Production:

- [ ] כל משתני הסביבה מוגדרים
- [ ] RLS מופעל על כל הטבלאות
- [ ] Service Role Key לא נחשף
- [ ] CRON_SECRET מוגדר וחזק
- [ ] HTTPS בלבד
- [ ] Security headers מוגדרים
- [ ] Input validation על כל הטפסים
- [ ] Error messages לא חושפים מידע רגיש
- [ ] Logging מוגדר נכון
- [ ] Backups אוטומטיים
- [ ] Monitoring מוגדר
- [ ] Rate limiting מופעל

### Regular Audits:

- [ ] סקירת הרשאות משתמשים
- [ ] עדכון dependencies
- [ ] בדיקת security alerts (Dependabot)
- [ ] סקירת logs לפעילות חשודה
- [ ] בדיקת backup integrity
- [ ] עדכון תיעוד אבטחה

## 🔍 Vulnerability Disclosure

אנו מאמינים ב-Responsible Disclosure. אם תדווחו באופן אחראי:

- נתן לכם קרדיט בהודעת התיקון (אם תרצו)
- נפרסם את הפגיעות לאחר התיקון
- נשקול bounty program בעתיד

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Vercel Security](https://vercel.com/docs/security)

## 📞 Contact

- Security Email: security@familynotify.com
- General Support: support@familynotify.com

---

**תודה על העזרה לשמור על FamilyNotify מאובטח! 🔒**



