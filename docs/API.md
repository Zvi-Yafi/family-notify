# API Documentation

## 📡 API Routes

### Admin Routes

#### POST `/api/admin/announcements`

יצירת הודעה חדשה.

**Request Body:**
\`\`\`json
{
  "title": "כותרת ההודעה",
  "bodyText": "תוכן ההודעה",
  "type": "GENERAL | SIMCHA",
  "familyGroupId": "uuid",
  "scheduledAt": "2025-11-10T10:00:00Z" // optional
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "announcement": {
    "id": "uuid",
    "title": "...",
    "body": "...",
    "type": "GENERAL",
    "createdAt": "...",
    "publishedAt": "..."
  }
}
\`\`\`

---

#### GET `/api/admin/announcements?familyGroupId={id}`

קבלת כל ההודעות של קבוצה.

**Query Parameters:**
- `familyGroupId` (required): UUID של הקבוצה

**Response:**
\`\`\`json
{
  "announcements": [
    {
      "id": "uuid",
      "title": "...",
      "body": "...",
      "type": "GENERAL",
      "creator": { "email": "..." },
      "createdAt": "..."
    }
  ]
}
\`\`\`

---

#### POST `/api/admin/events`

יצירת אירוע חדש.

**Request Body:**
\`\`\`json
{
  "title": "שם האירוע",
  "description": "תיאור (optional)",
  "startsAt": "2025-11-10T18:00:00Z",
  "endsAt": "2025-11-10T22:00:00Z", // optional
  "location": "מיקום",
  "familyGroupId": "uuid",
  "reminderOffsets": [1440, 60] // minutes before
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "...",
    "startsAt": "...",
    "location": "..."
  }
}
\`\`\`

---

#### GET `/api/admin/events?familyGroupId={id}`

קבלת כל האירועים הקרובים של קבוצה.

---

### Dispatch Routes

#### POST `/api/dispatch/announcement/:id`

שליחה ידנית של הודעה.

**Headers:**
\`\`\`
Authorization: Bearer {token}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Announcement dispatched"
}
\`\`\`

---

#### POST `/api/dispatch/event/:id/reminders`

שליחה ידנית של תזכורות לאירוע.

---

### Cron Routes

#### GET `/api/cron/due-announcements`

בודק ושולח הודעות מתוזמנות שזמנן הגיע.

**Headers:**
\`\`\`
Authorization: Bearer {CRON_SECRET}
\`\`\`

**Schedule:** כל 5 דקות

**Response:**
\`\`\`json
{
  "success": true,
  "processed": 3
}
\`\`\`

---

#### GET `/api/cron/event-reminders`

בודק ושולח תזכורות לאירועים קרובים.

**Headers:**
\`\`\`
Authorization: Bearer {CRON_SECRET}
\`\`\`

**Schedule:** כל 10 דקות

**Response:**
\`\`\`json
{
  "success": true,
  "eventsChecked": 5,
  "remindersSent": 2
}
\`\`\`

---

## 🔒 Authentication

כרגע האפליקציה משתמשת ב-Supabase Auth. בפרודקשן, כל ה-API routes צריכים לבדוק:

\`\`\`typescript
import { createServerClient } from '@/lib/supabase/server'

const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
\`\`\`

## 📝 Error Handling

כל ה-endpoints מחזירים errors בפורמט זה:

\`\`\`json
{
  "error": "Error message description"
}
\`\`\`

**Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 🚦 Rate Limiting

בפרודקשן מומלץ להוסיף rate limiting:

\`\`\`typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})
\`\`\`

## 🔐 CORS

ה-API פתוח רק לדומיין של האפליקציה. בפרודקשן הגדירו:

\`\`\`typescript
response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL)
response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
\`\`\`

## 📊 Monitoring

מומלץ להוסיף logging לכל API call:

\`\`\`typescript
console.log({
  timestamp: new Date().toISOString(),
  method: request.method,
  url: request.url,
  userId: user?.id,
  status: response.status,
})
\`\`\`

## 🧪 Testing

דוגמה לבדיקת API:

\`\`\`bash
# Create announcement
curl -X POST http://localhost:3000/api/admin/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "bodyText": "This is a test",
    "type": "GENERAL",
    "familyGroupId": "your-group-id"
  }'

# Get announcements
curl http://localhost:3000/api/admin/announcements?familyGroupId=your-group-id

# Trigger cron (with secret)
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/due-announcements
\`\`\`



