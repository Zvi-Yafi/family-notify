# 🔐 מדריך התחברות ל-API עם Postman

## שיטת התחברות עם Email + Password

### שלב 1: התחברות וקבלת Token

#### Request:
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "z0533113784@gmail.com",
  "password": "YOUR_PASSWORD"
}
```

#### Response:
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "z0533113784@gmail.com"
  },
  "session": {
    "access_token": "eyJhbGc...very-long-token",
    "refresh_token": "another-long-token",
    "expires_at": 1734567890,
    "expires_in": 3600
  },
  "message": "Login successful. Use the access_token in Authorization header as: Bearer <token>"
}
```

---

### שלב 2: שימוש ב-Token בבקשות API

העתק את `access_token` והוסף אותו לכל בקשה:

#### דוגמה - קבלת קבוצות:
```
GET http://localhost:3000/api/groups
Authorization: Bearer eyJhbGc...your-access-token
```

#### דוגמה - יצירת הכרזה:
```
POST http://localhost:3000/api/admin/announcements
Authorization: Bearer eyJhbGc...your-access-token
Content-Type: application/json

{
  "title": "הודעת בדיקה",
  "bodyText": "תוכן ההודעה",
  "type": "GENERAL",
  "familyGroupId": "69e05c1e-d89d-409a-8a98-8f2b885181ae"
}
```

---

## 📦 Postman Collection מעודכנת

```json
{
  "info": {
    "name": "Family Notify API - With Auth",
    "description": "API Collection with authentication support",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "yafi_group_id",
      "value": "69e05c1e-d89d-409a-8f2b885181ae",
      "type": "string"
    },
    {
      "key": "access_token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "// Save access token to collection variable",
                  "var jsonData = pm.response.json();",
                  "if (jsonData.session && jsonData.session.access_token) {",
                  "    pm.collectionVariables.set('access_token', jsonData.session.access_token);",
                  "    console.log('Access token saved!');",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"z0533113784@gmail.com\",\n  \"password\": \"YOUR_PASSWORD_HERE\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            },
            "description": "התחברות למערכת וקבלת access token.\nה-Token נשמר אוטומטית במשתנה access_token."
          },
          "response": []
        }
      ]
    },
    {
      "name": "Groups",
      "item": [
        {
          "name": "Get All Groups",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/groups",
              "host": ["{{base_url}}"],
              "path": ["api", "groups"]
            },
            "description": "מחזיר את כל הקבוצות (דורש authentication)"
          },
          "response": []
        },
        {
          "name": "Get Group Stats",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/admin/stats?familyGroupId={{yafi_group_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "admin", "stats"],
              "query": [
                {
                  "key": "familyGroupId",
                  "value": "{{yafi_group_id}}"
                }
              ]
            },
            "description": "סטטיסטיקות של קבוצת Yafi"
          },
          "response": []
        }
      ]
    },
    {
      "name": "Announcements",
      "item": [
        {
          "name": "Get Announcements",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/admin/announcements?familyGroupId={{yafi_group_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "admin", "announcements"],
              "query": [
                {
                  "key": "familyGroupId",
                  "value": "{{yafi_group_id}}"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Create Announcement",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"הודעת בדיקה מ-Postman\",\n  \"bodyText\": \"זוהי הודעת בדיקה\",\n  \"type\": \"GENERAL\",\n  \"familyGroupId\": \"{{yafi_group_id}}\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/admin/announcements",
              "host": ["{{base_url}}"],
              "path": ["api", "admin", "announcements"]
            }
          },
          "response": []
        }
      ]
    }
  ]
}
```

---

## 🔧 הגדרת Postman

### שיטה 1: שימוש אוטומטי (מומלץ)

1. **ייבא את הCollection למעלה**
2. **הרץ את "Login"** - ה-Token יישמר אוטומטית!
3. **כל הבקשות האחרות יעבדו** - הCollection משתמש ב-Bearer Token אוטומטית

### שיטה 2: ידני

1. **הרץ Login** והעתק את `access_token`
2. **ב-Authorization Tab:**
   - Type: `Bearer Token`
   - Token: `<paste-your-token-here>`

---

## ⏱️ תוקף Token

- **Access Token:** תקף ל-**1 שעה**
- **Refresh Token:** תקף ל-**7 ימים**

כשה-Token פג תוקף:
1. הרץ Login שוב
2. קבל Token חדש
3. המשך לעבוד

---

## 🧪 בדיקה מהירה

### 1. התחבר:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "z0533113784@gmail.com",
    "password": "your-password"
  }'
```

### 2. שמור את הToken

### 3. השתמש בו:
```bash
curl http://localhost:3000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 💡 טיפים

### שמירת Token בPostman Environment
1. לחץ על **Environments**
2. צור Environment חדש: `Family Notify`
3. הוסף משתנה: `access_token`
4. בLogin Request, הוסף Script:
   ```javascript
   pm.environment.set("access_token", pm.response.json().session.access_token);
   ```

### Debug
אם יש שגיאת Authentication:
1. בדוק שהToken לא פג תוקף
2. ודא ש-Authorization header נשלח
3. בדוק שה-Bearer prefix קיים

---

## 🚀 מוכן לשימוש!

עכשיו תוכל לעבוד עם ה-API מ-Postman בקלות:
- ✅ התחברות פשוטה עם Email + Password
- ✅ Token נשמר אוטומטית
- ✅ כל הבקשות מאומתות
- ✅ עובד בדיוק כמו הדפדפן

**נהנה!** 🎉
