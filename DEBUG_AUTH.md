# 🐛 Debug - כניסה עם Google

## מה תיקנתי:

### 1. תיקון שמירת Cookies
**הבעיה:** Supabase שומר כמה cookies (access_token, refresh_token, וכו'), והקוד הישן החליף כל פעם רק אחד.

**התיקון:** עכשיו מוסיפים cookies למערך של `Set-Cookie` headers במקום להחליף.

### 2. שיפור useAuth Hook
**הבעיה:** הקוד לא ניסה קודם `getSession()` רק `getUser()`.

**התיקון:** עכשיו מנסה `getSession()` תחילה (יותר אמין), ואז `getUser()` כ-fallback.

### 3. הוספת Logging מפורט
כדי לעקוב אחרי הבעיה בקונסול.

---

## 🧪 בדיקה

### 1. נקה הכל
```bash
# Terminal: עצור את השרת
Ctrl+C

# Chrome DevTools (F12)
Application → Storage → Clear site data
```

### 2. הפעל מחדש
```bash
npm run dev
```

### 3. התחבר מחדש
1. גש ל: http://localhost:3002/login
2. לחץ "התחבר עם Google"
3. בחר חשבון

---

## 📊 מה אמור לקרות:

### בקונסול הדפדפן (F12 → Console):
```
🔐 Google OAuth redirect URL: http://localhost:3002/api/auth/callback
```

### בקונסול השרת (Terminal):
```
🔐 OAuth Callback: { code: 'present', origin: 'http://localhost:3002' }
✅ Session created for user: your@email.com
🍪 Session expires at: ...
🍪 Setting cookies: 3
📝 Creating/syncing user in database: your@email.com
✅ User in database: created (או exists)
🔄 Redirecting to /feed
```

### אחרי הניתוב ל-/feed:
```
✅ Found session for: your@email.com
🔄 Auth state changed: INITIAL_SESSION your@email.com
```

### ההדר צריך להראות:
- ✅ כפתורים: "הודעות", "אירועים", "הקבוצות שלי", "ניהול"
- ✅ אייקון משתמש עם dropdown
- ✅ בתפריט: האימייל שלך

---

## 🔍 בדיקת Cookies

### Chrome DevTools → Application → Cookies → localhost:3002

אמור לראות:
```
sb-[project]-auth-token          (Supabase access token)
sb-[project]-auth-token-code-verifier
```

### אם אין cookies:
1. בדוק בקונסול השרת אם רואים: `🍪 Setting cookies: 3`
2. בדוק ש-Supabase Dashboard מוגדר נכון
3. בדוק שאין שגיאות CORS

---

## ❌ אם עדיין לא עובד:

### בעיה: "⚠️ No session found"
**בדוק:**
1. Cookies נשמרו (DevTools → Application → Cookies)
2. הסרת את כל ה-cookies הישנים לפני בדיקה
3. שה-redirect URI ב-Google Console נכון

### בעיה: "❌ Session error" 
**פתרון:**
1. בדוק את משתני הסביבה:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
2. רסטרט השרת

### בעיה: 401 על API calls
**בדוק:**
1. שהמשתמש נוצר ב-database (שורה: `✅ User in database`)
2. ש-middleware לא חוסם (בדוק `/api/groups` בנתוב)

---

## 🎯 Checklist מהיר:

- [ ] רסטרט שרת (`Ctrl+C` → `npm run dev`)
- [ ] נקה cookies (DevTools → Clear site data)
- [ ] התחבר עם Google
- [ ] בדוק בקונסול השרת: `🍪 Setting cookies`
- [ ] בדוק בקונסול הדפדפן: `✅ Found session for`
- [ ] ההדר מראה את האימייל שלך ✅
- [ ] לחיצה על "הקבוצות שלי" עובדת ✅

---

**אם הכל עובד - מזל טוב! 🎉**

התחברות עם Google מוכנה!

