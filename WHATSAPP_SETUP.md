# 📱 הגדרת WhatsApp Cloud API - Family Notify

## 🔴 למה זה לא עובד?

**הסיבה:** WhatsApp Cloud API דורש הגדרה ב-Meta (Facebook) Business.

---

## ✅ איך להגדיר WhatsApp Cloud API

### שלב 1: צור Meta Business Account

1. **עבור ל:** https://business.facebook.com
2. **צור חשבון** (או התחבר אם יש לך)
3. **Business Settings** → **Accounts** → **WhatsApp Accounts**

### שלב 2: צור WhatsApp Business App

1. **עבור ל:** https://developers.facebook.com/apps
2. **Create App** → בחר **Business** → **Continue**
3. **App Name:** FamilyNotify (או שם אחר)
4. **App Contact Email:** האימייל שלך
5. **Create App**

### שלב 3: הוסף WhatsApp Product

1. ב-**App Dashboard** → לחץ **Add Product**
2. מצא **WhatsApp** → לחץ **Set Up**
3. בחר **Meta Business Account** שלך

### שלב 4: קבל את ה-Credentials

1. **WhatsApp** → **API Setup**
2. תמצא:
   - **Phone number ID** (מספר ארוך)
   - **Temporary access token** (תקף ל-24 שעות)
   - **Business Account ID** (בתחתית הדף)

3. **העתק את כל השלושה!** 📝

### שלב 5: קבל Permanent Access Token

1. **WhatsApp** → **API Setup** → **Access Tokens**
2. **Generate Token** → בחר את ה-Business Account
3. **העתק את ה-Token** (זה ה-Permanent token)

### שלב 6: הוסף ל-.env.local

```bash
WHATSAPP_PHONE_NUMBER_ID="[Phone Number ID מ-Meta]"
WHATSAPP_ACCESS_TOKEN="[Permanent Access Token]"
WHATSAPP_BUSINESS_ACCOUNT_ID="[Business Account ID]"
```

### שלב 7: הוסף מספר טלפון (Phone Number)

1. **WhatsApp** → **Phone Numbers** → **Add Phone Number**
2. בחר מספר טלפון (או הוסף חדש)
3. **Verify** את המספר (SMS או שיחה)
4. **העתק את ה-Phone Number ID** החדש

---

## 🧪 בדיקה

### 1. רסטרט השרת
```bash
Ctrl+C
npm run dev
```

### 2. גש לדף הבדיקה
```
http://localhost:3002/test-whatsapp
```

### 3. שלח הודעת בדיקה
1. הזן מספר טלפון (למשל: `+972-50-1234567`)
2. לחץ "שלח הודעת WhatsApp בדיקה"
3. בדוק את ה-WhatsApp שלך!

---

## ⚠️ חשוב לדעת

### 1. פורמט מספר טלפון
- **נכון:** `+972501234567` או `972501234567`
- **לא נכון:** `050-123-4567` (עם מקפים)

### 2. Test Numbers
- במצב Testing, אפשר לשלוח רק למספרים שהוגדרו כ-Test Numbers
- **הוסף Test Numbers:** Meta Business → WhatsApp → **Phone Numbers** → **Test Numbers**

### 3. Production
- ל-Production צריך:
  - Business Verification ב-Meta
  - מספר טלפון מאומת
  - יכול לקחת כמה ימים

---

## 🔧 פתרון בעיות

### שגיאה: "Invalid phone number"
**פתרון:** 
- ודא שהמספר בפורמט נכון (ללא רווחים, מקפים)
- פורמט: `+972501234567` או `972501234567`

### שגיאה: "Recipient phone number not in allowed list"
**פתרון:**
- הוסף את המספר ל-Test Numbers ב-Meta Business

### שגיאה: "Invalid access token"
**פתרון:**
- ודא שהשתמשת ב-Permanent Token (לא Temporary)
- בדוק שה-Token לא פג תוקף

### שגיאה: "Phone number ID not found"
**פתרון:**
- ודא שה-Phone Number ID נכון
- בדוק ב-Meta Business → WhatsApp → Phone Numbers

---

## 📊 Checklist

- [ ] Meta Business Account נוצר
- [ ] WhatsApp App נוצר
- [ ] WhatsApp Product נוסף ל-App
- [ ] Phone Number ID הועתק
- [ ] Permanent Access Token נוצר והועתק
- [ ] Business Account ID הועתק
- [ ] כל השלושה נוספו ל-.env.local
- [ ] רסטרט השרת
- [ ] בדיקה ב-/test-whatsapp עובדת ✅

---

## 💰 עלויות

### Testing Mode
- **חינם** - עד 1,000 הודעות/חודש
- מוגבל ל-Test Numbers בלבד

### Production
- **$0.005-$0.09** להודעה (תלוי בסוג)
- דורש Business Verification

---

## 🔗 קישורים שימושיים

- Meta Business: https://business.facebook.com
- Facebook Developers: https://developers.facebook.com
- WhatsApp Cloud API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

---

## 📝 דוגמה ל-.env.local

```bash
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_BUSINESS_ACCOUNT_ID="987654321098765"
```

---

**אחרי ההגדרה - WhatsApp יעבוד! 🎉**



