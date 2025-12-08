# 🌐 הגדרת דומיין Production - famnotify.com

## ✅ מה כבר עשית

הוספת את הדומיין `famnotify.com` ל-Google OAuth ב-Google Cloud Console.

---

## 🔧 מה עוד צריך לעשות

### שלב 1: הוסף את הדומיין ב-Google Cloud Console

**עבור ל:** https://console.cloud.google.com

1. **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**
2. **בחר את ה-Client ID שלך** (או צור חדש)
3. **Edit** → **Authorized redirect URIs**

**הוסף את ה-URLs הבאים:**

```
https://[YOUR-SUPABASE-PROJECT].supabase.co/auth/v1/callback
http://localhost:3002/api/auth/callback
http://localhost:3000/api/auth/callback
https://famnotify.com/api/auth/callback
https://www.famnotify.com/api/auth/callback
```

**Authorized JavaScript origins:**

```
http://localhost:3002
http://localhost:3000
https://famnotify.com
https://www.famnotify.com
```

4. **שמור**

---

### שלב 2: הוסף את הדומיין ב-Supabase Dashboard

**עבור ל:** https://supabase.com/dashboard

1. **בחר את הפרויקט שלך**
2. **Authentication** → **URL Configuration**

3. **Site URL:**
   ```
   https://famnotify.com
   ```

4. **Redirect URLs** - הוסף:
   ```
   http://localhost:3002/api/auth/callback
   http://localhost:3000/api/auth/callback
   https://famnotify.com/api/auth/callback
   https://www.famnotify.com/api/auth/callback
   ```

5. **שמור**

---

### שלב 3: הגדר את הדומיין ב-Vercel (או Hosting אחר)

#### אם אתה משתמש ב-Vercel:

1. **עבור ל:** https://vercel.com/dashboard
2. **בחר את הפרויקט**
3. **Settings** → **Domains**
4. **Add Domain** → הזן: `famnotify.com`
5. **Add** → עקוב אחר ההוראות ל-DNS

#### הגדר DNS:

הוסף את ה-Records הבאים ב-DNS Provider שלך:

**Type A:**
```
@ → 76.76.21.21 (Vercel IP)
```

**Type CNAME:**
```
www → cname.vercel-dns.com
```

---

### שלב 4: עדכן משתני סביבה ב-Production

**ב-Vercel Dashboard:**

1. **Settings** → **Environment Variables**
2. ודא שיש לך:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-KEY]
DATABASE_URL=[YOUR-DB-URL]
```

3. **Redeploy** את האפליקציה

---

## 🧪 בדיקה

### 1. בדוק שהדומיין עובד

```
https://famnotify.com
```

אמור לראות את האפליקציה!

### 2. בדוק Google OAuth

1. גש ל: `https://famnotify.com/login`
2. לחץ **"התחבר עם Google"**
3. בחר חשבון Google
4. אמור לחזור ל-`https://famnotify.com/feed` מחובר! ✅

---

## 🔍 איך זה עובד

הקוד כבר תומך בדומיין החדש כי הוא משתמש ב-`window.location.origin`:

```typescript
// pages/login.tsx
const redirectUrl = `${window.location.origin}/api/auth/callback`
```

זה אומר:
- **ב-localhost:** `http://localhost:3002/api/auth/callback`
- **ב-production:** `https://famnotify.com/api/auth/callback`

**אוטומטי!** 🎉

---

## 📋 Checklist

- [ ] Google Cloud Console: הוספתי `https://famnotify.com/api/auth/callback`
- [ ] Google Cloud Console: הוספתי `https://www.famnotify.com/api/auth/callback`
- [ ] Supabase: Site URL = `https://famnotify.com`
- [ ] Supabase: Redirect URLs כוללים את `famnotify.com`
- [ ] Vercel: הדומיין מוגדר ומחובר
- [ ] DNS: Records מוגדרים נכון
- [ ] בדיקה: האפליקציה נטענת ב-`https://famnotify.com`
- [ ] בדיקה: Google OAuth עובד ב-production

---

## 🐛 בעיות נפוצות

### "redirect_uri_mismatch" ב-Production

**פתרון:**
1. ודא שהוספת את `https://famnotify.com/api/auth/callback` ב-Google Console
2. ודא שהוספת את אותו URL ב-Supabase Redirect URLs
3. ודא שה-URL זהה **בדיוק** (ללא רווחים, עם/בלי www)

### הדומיין לא נטען

**פתרון:**
1. בדוק את ה-DNS Records (יכול לקחת עד 24 שעות)
2. בדוק ב-Vercel שהדומיין מאומת
3. נסה `https://www.famnotify.com` במקום `https://famnotify.com`

### OAuth עובד ב-localhost אבל לא ב-Production

**פתרון:**
1. ודא שהוספת את ה-production URLs ב-Google Console
2. ודא שהוספת את ה-production URLs ב-Supabase
3. נקה cookies ונסה שוב
4. בדוק את ה-Console ב-Browser (F12) לשגיאות

---

## 🔗 קישורים שימושיים

- **Google Cloud Console:** https://console.cloud.google.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**אחרי ההגדרה - הכל יעבוד ב-Production! 🚀**



