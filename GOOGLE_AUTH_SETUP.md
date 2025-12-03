# הגדרת התחברות עם Google - Family Notify

## מה צריך להגדיר?

### 1. ב-Supabase Dashboard

1. **כנס ל-Supabase Dashboard**: https://supabase.com/dashboard
2. **בחר את הפרויקט שלך**
3. **עבור ל-Authentication** (מהתפריט הצדדי)
4. **לחץ על Providers**
5. **מצא את Google ולחץ עליו**

### 2. הפעל את Google Provider

בעמוד הגדרות Google, תצטרך:

#### A. צור Google OAuth Application
1. עבור ל-**Google Cloud Console**: https://console.cloud.google.com/
2. צור פרויקט חדש או בחר קיים
3. עבור ל-**APIs & Services > Credentials**
4. לחץ על **Create Credentials > OAuth client ID**
5. בחר **Web application**
6. הוסף את ה-URLs הבאים:

**Authorized JavaScript origins:**
```
http://localhost:3002
http://localhost:3000
https://[YOUR-DOMAIN].vercel.app
```

**Authorized redirect URIs:**
```
https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
http://localhost:3002/api/auth/callback
http://localhost:3000/api/auth/callback
```

7. **שמור את Client ID ו-Client Secret**

#### B. הגדר את Supabase
1. חזור ל-Supabase Dashboard > Authentication > Providers > Google
2. **הפעל את Google Provider** (Toggle ON)
3. הזן:
   - **Client ID** (מ-Google Console)
   - **Client Secret** (מ-Google Console)
4. לחץ על **Save**

### 3. וודא את ההגדרות ב-.env.local

קובץ `.env.local` שלך צריך להכיל:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-KEY]"

# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 4. בדיקה

לאחר ההגדרה:

1. **רסטרט את השרת** (Ctrl+C ואז `npm run dev`)
2. גש ל-`http://localhost:3002/login`
3. לחץ על **"התחבר עם Google"**
4. אמור להפנות אותך ל-Google login
5. לאחר התחברות - תועבר ל-`/feed`

---

## בעיות נפוצות

### שגיאה: "redirect_uri_mismatch"
**פתרון:** וודא שהוספת את כל ה-redirect URIs הנכונים ב-Google Console

### שגיאה: "Invalid login credentials"
**פתרון:** וודא ש-Client ID ו-Secret נכונים ב-Supabase

### התחברות לא עובדת ב-localhost
**פתרון:** וודא שהוספת `http://localhost:3002` ו-`http://localhost:3000` ל-Authorized origins

---

## קבצים רלוונטיים בפרויקט

- `pages/login.tsx` - דף ההתחברות
- `pages/api/auth/callback.ts` - מטפל ב-callback מ-Google
- `lib/supabase/client.ts` - Supabase client
- `lib/supabase/server.ts` - Supabase server client

---

## מצב נוכחי

✅ הקוד מוכן ועובד
⚠️ דרוש הגדרה ב-Supabase Dashboard
⚠️ דרוש יצירת Google OAuth Application

כאשר תסיים את ההגדרות, התחברות עם Google תעבוד!

