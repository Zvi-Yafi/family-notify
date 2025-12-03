# ⚡ תיקון מהיר - Google Auth

## 🔴 מה הבעיה?

Google מחזיר אותך ל-`/?code=...` במקום ל-`/api/auth/callback?code=...`

## ✅ פתרון (3 דקות)

### 1. Google Cloud Console
עבור ל: https://console.cloud.google.com

**Credentials → OAuth 2.0 → Edit**

**Authorized redirect URIs** - תקן ל:
```
https://cgmztbbeqtfmkuazwgoc.supabase.co/auth/v1/callback
http://localhost:3002/api/auth/callback
http://localhost:3000/api/auth/callback
```

⚠️ **חשוב:** `/api/auth/callback` ולא רק `/` !!!

**שמור**

---

### 2. Supabase Dashboard (אם עדיין לא הגדרת)
עבור ל: https://supabase.com/dashboard

**Authentication → URL Configuration**

**Redirect URLs:**
```
http://localhost:3002/api/auth/callback
http://localhost:3000/api/auth/callback
```

**שמור**

---

### 3. רסטרט השרת
```bash
# Terminal:
Ctrl+C
npm run dev
```

---

### 4. נקה Cookies + נסה שוב
1. Chrome DevTools (F12)
2. Application → Cookies → מחק הכל
3. גש ל: http://localhost:3002/login
4. "התחבר עם Google"

---

## ✅ אמור לעבוד!

אתה אמור לראות בקונסול:
```
🔐 Google OAuth redirect URL: ...
🔐 OAuth Callback: { code: 'present' ... }
✅ Session created for user: ...
```

ולהגיע ל-`/feed` מחובר!

---

**קרא את GOOGLE_AUTH_FIX.md להסבר מפורט**
