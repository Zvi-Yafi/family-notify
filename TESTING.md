# מדריך בדיקות - Family Notify

## סקירה כללית

הפרויקט כולל מערכת בדיקות מקיפה עם שלושה סוגי בדיקות:

1. **בדיקות יחידה (Unit Tests)** - בדיקות לפונקציות, שירותים ו-utilities
2. **בדיקות אינטגרציה (Integration Tests)** - בדיקות ל-API routes וקומפוננטות React
3. **בדיקות E2E (End-to-End Tests)** - בדיקות מלאות של תהליכי משתמש עם Playwright

## הרצת הבדיקות

### בדיקות יחידה ואינטגרציה (Jest)

```bash
# הרצת כל הבדיקות במצב watch
npm test

# הרצת בדיקות פעם אחת
npm run test:ci

# הרצת בדיקות עם כיסוי קוד (coverage)
npm run test:ci
```

### בדיקות E2E (Playwright)

```bash
# הרצת בדיקות E2E
npm run test:e2e

# הרצת בדיקות E2E עם UI
npm run test:e2e:ui

# התקנת דפדפנים לבדיקות E2E (פעם ראשונה)
npx playwright install
```

## מבנה הבדיקות

```
Family Notify/
├── __tests__/              # בדיקות Jest
│   ├── app/
│   │   └── api/           # בדיקות API routes
│   ├── components/        # בדיקות קומפוננטות React
│   ├── lib/              # בדיקות לשירותים ופונקציות
│   └── utils/            # עזרים לבדיקות
├── e2e/                   # בדיקות Playwright E2E
│   ├── home.spec.ts
│   ├── admin.spec.ts
│   ├── auth.spec.ts
│   └── preferences.spec.ts
├── jest.config.js         # הגדרות Jest
├── jest.setup.js          # Setup לבדיקות Jest
└── playwright.config.ts   # הגדרות Playwright
```

## כיסוי הבדיקות

### 1. פונקציות Utility (`lib/utils.ts`)
- ✅ `cn()` - מיזוג class names
- ✅ `formatDate()` - עיצוב תאריכים
- ✅ `slugify()` - המרה ל-slug

### 2. Auth Helpers (`lib/auth-helpers.ts`)
- ✅ `getCurrentUser()` - קבלת משתמש נוכחי
- ✅ `isAuthenticated()` - בדיקת אימות
- ✅ `requireAuth()` - דרישת אימות

### 3. Dispatch Service (`lib/dispatch/dispatch.service.ts`)
- ✅ `dispatchAnnouncement()` - שליחת הודעות
- ✅ `dispatchEventReminder()` - שליחת תזכורות לאירועים
- ✅ טיפול בערוצי תקשורת שונים
- ✅ טיפול בשגיאות

### 4. Providers
- ✅ **Email Provider** - שליחת אימיילים דרך Resend
- ✅ **SMS Provider** - שליחת SMS דרך Twilio
- ✅ **WhatsApp Provider** - שליחת הודעות WhatsApp
- ✅ **Push Provider** - התראות Push עם Web Push

### 5. API Routes
- ✅ **Announcements API** (`/api/admin/announcements`)
  - POST - יצירת הודעה
  - GET - קבלת הודעות
- ✅ **Events API** (`/api/admin/events`)
  - POST - יצירת אירוע
  - GET - קבלת אירועים

### 6. קומפוננטות React
- ✅ **Button** - כפתור עם variants שונים
- ✅ **Input** - שדה קלט
- ✅ **Header** - כותרת האפליקציה עם ניווט

### 7. בדיקות E2E
- ✅ דף הבית
- ✅ פאנל ניהול
- ✅ הגדרות משתמש
- ✅ תהליך אימות
- ✅ נתיבים מוגנים

## דרישות כיסוי קוד

הפרויקט מגדיר דרישות מינימום לכיסוי קוד:

```javascript
{
  branches: 70%,
  functions: 70%,
  lines: 70%,
  statements: 70%
}
```

## כתיבת בדיקות חדשות

### בדיקת יחידה לפונקציה

```typescript
import { myFunction } from '@/lib/my-module'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

### בדיקה לקומפוננטה React

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<MyComponent onClick={handleClick} />)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### בדיקת API Route

```typescript
import { GET, POST } from '@/app/api/my-route/route'
import { NextRequest } from 'next/server'

describe('My API Route', () => {
  it('should return data', async () => {
    const request = {
      url: 'http://localhost:3000/api/my-route',
    } as NextRequest

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toBeDefined()
  })
})
```

### בדיקת E2E

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to page', async ({ page }) => {
  await page.goto('/')
  
  await page.click('text=My Link')
  
  await expect(page).toHaveURL(/\/my-page/)
  await expect(page.getByText('Page Title')).toBeVisible()
})
```

## טיפים לבדיקות

### 1. שימוש ב-Mocks

```typescript
// Mock של Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock של provider
jest.mock('@/lib/providers/email.provider', () => ({
  emailProvider: mockEmailProvider,
}))
```

### 2. ניקוי לפני כל בדיקה

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

### 3. שימוש ב-Test Helpers

```typescript
import { mockUser, mockAnnouncement } from '../utils/test-helpers'

const user = mockUser({ email: 'custom@example.com' })
const announcement = mockAnnouncement({ title: 'Custom Title' })
```

### 4. בדיקות אסינכרוניות

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### 5. בדיקות E2E עם אימות

```typescript
test.skip('requires authentication', async ({ page }) => {
  // This test will be skipped until authentication is set up
  await page.goto('/protected-route')
  // ... test code
})
```

## CI/CD

הפרויקט כולל workflow של GitHub Actions שמריץ את כל הבדיקות:

- ✅ בדיקות Jest עם כיסוי קוד
- ✅ בדיקות Playwright E2E
- ✅ Type checking עם TypeScript
- ✅ Linting

## שאלות נפוצות

### מה עושים כשבדיקה נכשלת?

1. הריצו את הבדיקה הספציפית: `npm test -- <test-file-name>`
2. בדקו את הודעת השגיאה
3. הריצו את הקוד במצב debug
4. עדכנו את הבדיקה או תקנו את הקוד

### איך מריצים רק בדיקה אחת?

```bash
# Jest
npm test -- --testNamePattern="test name"

# Playwright
npx playwright test --grep "test name"
```

### איך מדלגים על בדיקה זמנית?

```typescript
// Jest
it.skip('test to skip', () => {
  // ...
})

// Playwright
test.skip('test to skip', async ({ page }) => {
  // ...
})
```

### איך מריצים בדיקות במצב watch?

```bash
npm test
```

### איך רואים דוח כיסוי קוד?

```bash
npm run test:ci
open coverage/lcov-report/index.html
```

## משאבים נוספים

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)


