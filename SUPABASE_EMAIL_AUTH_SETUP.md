# הגדרת התחברות עם אימייל וסיסמה ב-Supabase

## שלב 1: הפעלת Email Provider ב-Supabase

1. **כנס ל-Supabase Dashboard**: https://supabase.com/dashboard
2. **בחר את הפרויקט שלך**: `Family Notify`
3. **נווט ל-Authentication** → **Providers**
4. **מצא את "Email"** (צריך להיות מופעל כברירת מחדל)
5. **ודא שההגדרות הבאות מופעלות**:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (אופציונלי - אם רוצה שמשתמשים יאמתו את האימייל)
   - ✅ **Secure email change** (מומלץ)

---

## שלב 2: הגדרות אימות אימייל (אופציונלי)

אם תרצה **לדלג על אימות אימייל** בשלב הפיתוח:

1. **Authentication** → **Providers** → **Email**
2. **כבה את** "Confirm email"
3. **שמור** את השינויים

⚠️ **הערה**: בסביבת ייצור (production) מומלץ להשאיר את אימות האימייל מופעל!

---

## שלב 3: הגדרת Email Templates (אופציונלי)

אם רוצה לעצב את מיילי האימות:

1. **Authentication** → **Email Templates**
2. **בחר** "Confirm signup"
3. **ערוך** את התבנית בעברית אם רוצה
4. **שמור**

---

## שלב 4: בדיקת הגדרות Site URL

1. **Authentication** → **URL Configuration**
2. **ודא ש-Site URL הוא**: `http://localhost:3000`
3. **הוסף Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/feed`

---

## ✅ סיימת!

עכשיו תוכל:
- **להירשם** עם אימייל וסיסמה
- **להתחבר** עם אימייל וסיסמה
- **להתחבר** עם Google

---

## 🧪 בדיקה

1. פתח את האתר: http://localhost:3000/login
2. בחר בטאב **"הרשמה"**
3. מלא:
   - שם מלא
   - אימייל
   - סיסמה (לפחות 6 תווים)
4. לחץ על **"הירשם"**
5. אם הכל עובד - תועבר לדף `/feed`

---

## 🔍 פתרון בעיות

### משתמש לא יכול להירשם
- בדוק ש-Email provider מופעל ב-Supabase
- בדוק שאין כבר משתמש עם אותו אימייל
- בדוק את ה-Console בדפדפן לשגיאות

### לא מקבל מייל אימות
- בדוק ב-Spam
- בדוק ב-Supabase Dashboard → Authentication → Logs
- אם בפיתוח, כבה את "Confirm email"

### שגיאת "Invalid login credentials"
- הסיסמה שגויה
- המשתמש לא קיים
- נסה להירשם מחדש


