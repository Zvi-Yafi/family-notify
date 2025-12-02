# 🔐 הגדרת התחברות עם Google

## מה נוסף?

✅ דף Login מעוצב עם כפתור Google  
✅ Authentication עם Supabase  
✅ Context וניהול מצב משתמש  
✅ Header עם תפריט משתמש ויציאה  
✅ Middleware להגנה על דפים  

---

## 📋 כדי להפעיל את ההתחברות עם Google:

### שלב 1: הגדרת Google OAuth

1. **עבור ל-Google Cloud Console:**
   - גש ל-[https://console.cloud.google.com](https://console.cloud.google.com)
   - צור פרויקט חדש או בחר קיים

2. **הפעל את Google+ API:**
   - בתפריט צד, לך ל-**APIs & Services** → **Library**
   - חפש **Google+ API**
   - לחץ **Enable**

3. **צור OAuth 2.0 Credentials:**
   - לך ל-**APIs & Services** → **Credentials**
   - לחץ **Create Credentials** → **OAuth client ID**
   - בחר **Application type**: **Web application**
   - תן שם לאפליקציה: `FamilyNotify`

4. **הוסף Authorized redirect URIs:**
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   
   **איפה למצוא את ה-PROJECT-REF?**
   - זה החלק ב-URL של ה-Supabase שלך
   - לדוגמה: אם ה-URL שלך הוא `https://cgmztbbeqtfmkuazwgoc.supabase.co`
   - אז ה-redirect URI הוא: `https://cgmztbbeqtfmkuazwgoc.supabase.co/auth/v1/callback`

5. **שמור את הפרטים:**
   - לחץ **Create**
   - העתק את:
     - **Client ID**
     - **Client Secret**

---

### שלב 2: הגדרת Supabase

1. **עבור ל-Supabase Dashboard:**
   - גש לפרויקט שלך ב-[https://supabase.com](https://supabase.com)
   - לך ל-**Authentication** → **Providers**

2. **הפעל את Google:**
   - מצא את **Google** ברשימת הספקים
   - לחץ להפעלה
   - הזן את הפרטים מ-Google Cloud Console:
     - **Client ID** (שהעתקת)
     - **Client Secret** (שהעתקת)
   - לחץ **Save**

---

### שלב 3: עדכן Authorized JavaScript origins (אופציונלי למקומי)

אם אתה רוצה לבדוק מקומית:

1. חזור ל-Google Cloud Console → Credentials
2. ערוך את ה-OAuth 2.0 Client
3. הוסף ב-**Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```
4. הוסף ב-**Authorized redirect URIs**:
   ```
   http://localhost:54321/auth/v1/callback
   ```

---

## 🎯 איך זה עובד?

### זרימת ההתחברות:

1. **משתמש לוחץ על "התחבר עם Google"**
   ```
   /login → כפתור Google → Supabase Auth
   ```

2. **Supabase מפנה ל-Google**
   ```
   Google OAuth Screen → משתמש מאשר
   ```

3. **Google מחזיר ל-Callback**
   ```
   /auth/callback → מחליף קוד ב-session → מפנה ל-/feed
   ```

4. **משתמש מחובר!**
   ```
   Header מציג את המשתמש + תפריט
   ```

---

## 🔒 דפים מוגנים

הדפים הבאים דורשים התחברות:
- `/admin` - ניהול הודעות ואירועים
- `/preferences` - העדפות משתמש

אם משתמש לא מחובר מנסה להיכנס:
→ יופנה ל-`/login?redirectTo=/admin`

---

## 🧪 בדיקה

1. **התחבר:**
   ```bash
   http://localhost:3000/login
   ```

2. **לחץ על "התחבר עם Google"**

3. **בחר חשבון Google**

4. **אמור לראות:**
   - הפניה ל-`/feed`
   - Header מציג את המשתמש
   - אפשרות לצאת

5. **נסה להיכנס ל-`/admin` ללא התחברות:**
   - אמור להפנות ל-`/login`

---

## 📁 קבצים שנוצרו:

```
app/
├── login/
│   └── page.tsx                    # דף התחברות
├── auth/
│   └── callback/
│       └── route.ts                 # טיפול בחזרה מ-Google
│
lib/
├── hooks/
│   └── use-auth.ts                  # Hook לניהול authentication
├── auth-helpers.ts                  # Helper functions לשרת
│
components/
├── header.tsx                       # Header עם תפריט משתמש
└── ui/
    └── dropdown-menu.tsx            # Dropdown component
│
middleware.ts                        # הגנה על דפים
```

---

## 🚨 שגיאות נפוצות

### "Invalid redirect URI"
**פתרון:** ודא שה-redirect URI ב-Google Cloud Console תואם בדיוק ל-URL של Supabase.

### "User not authenticated" במשתמש מחובר
**פתרון:** נקה cookies ונסה שוב. ייתכן שה-session פג.

### "Cannot read property 'user' of undefined"
**פתרון:** ודא שמשתני הסביבה (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) מוגדרים ב-`.env.local`.

---

## 🎨 עיצוב התאמה אישית

### שינוי עיצוב דף Login:
ערוך את `app/login/page.tsx`

### שינוי Header:
ערוך את `components/header.tsx`

### הוספת ספק נוסף (GitHub, Facebook):
1. הפעל ב-Supabase Dashboard
2. עדכן את `app/login/page.tsx` להוסיף כפתור
3. קרא ל-`supabase.auth.signInWithOAuth({ provider: 'github' })`

---

## 🔗 קישורים שימושיים

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://support.google.com/cloud/answer/6158849)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**זהו! ההתחברות עם Google מוכנה לשימוש! 🎉**

פשוט סיים את ההגדרות ב-Google Cloud Console ו-Supabase ואתה מוכן לעבודה!


