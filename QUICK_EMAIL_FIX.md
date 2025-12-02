# ⚡ תיקון מהיר - בעיית האימייל

## 🎯 הבעיה
מקבל הודעה "בדוק אימייל" אבל האימייל לא מגיע + הנתונים לא נשמרים.

## ✅ הפתרון (1 דקה)

### כבה אימות אימייל ב-Supabase:

1. לך ל: https://supabase.com/dashboard
2. בחר את הפרויקט **Family Notify**
3. לך ל: **Authentication** → **Providers**
4. לחץ על **Email**
5. **כבה** את: ✅ "Confirm email"
6. **שמור**

זהו! 🎉

---

## 🧪 בדיקה

```bash
# 1. פתח Prisma Studio (בטרמינל חדש)
npm run prisma:studio

# 2. הירשם ב: http://localhost:3000/login

# 3. בדוק ב-Prisma Studio → טבלת User
# המשתמש צריך להופיע מיידית! ✅
```

---

## 📝 מה תוקן?

**גם בלי לכבות אימות אימייל** - המשתמש עכשיו **נשמר ב-database מיידית**!

```
הרשמה → נשמר ב-database ✅ → (אימות אימייל אם מופעל)
```

---

**לפרטים מלאים**: קרא [FIX_EMAIL_ISSUE.md](./FIX_EMAIL_ISSUE.md)


