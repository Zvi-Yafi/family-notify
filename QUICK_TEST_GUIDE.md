# 🚀 מדריך מהיר - בדיקות Family Notify

## התחלה מהירה ב-3 שלבים

### 1️⃣ התקנה
```bash
cd "/Users/zvika/Documents/Family Notify"
npm install
npx playwright install
```

### 2️⃣ הרצת בדיקות
```bash
# כל הבדיקות בפעם אחת
npm run test:ci

# בדיקות במצב watch (לפיתוח)
npm test

# בדיקות E2E
npm run test:e2e
```

### 3️⃣ צפייה בתוצאות
```bash
# דוח כיסוי
open coverage/lcov-report/index.html

# דוח Playwright
open playwright-report/index.html
```

---

## 📋 פקודות שימושיות

### בדיקות יחידה (Jest)
```bash
npm test                           # מצב watch
npm run test:ci                    # פעם אחת + coverage
npm test -- <filename>             # קובץ ספציפי
npm test -- --testNamePattern="name"  # בדיקה ספציפית
```

### בדיקות E2E (Playwright)
```bash
npm run test:e2e                   # כל הבדיקות
npm run test:e2e:ui                # מצב UI
npx playwright test --grep "name" # בדיקה ספציפית
npx playwright show-report        # הצגת דוח
```

### בדיקות איכות קוד
```bash
npm run lint                       # ESLint
npm run type-check                 # TypeScript
npm run format                     # Prettier
```

---

## 🎯 מה לבדוק?

### ✅ אחרי שינוי בקוד
```bash
# בדוק שהבדיקות עדיין עוברות
npm test -- <relevant-test-file>
```

### ✅ לפני commit
```bash
# הרץ את כל הבדיקות
npm run test:ci && npm run lint
```

### ✅ לפני PR/push
```bash
# בדיקה מלאה כולל E2E
npm run test:ci
npm run test:e2e
npm run lint
npm run type-check
```

---

## 🐛 פתרון בעיות

### בדיקה נכשלת?
1. קרא את הודעת השגיאה
2. הרץ את הבדיקה הספציפית: `npm test -- <filename>`
3. בדוק אם השינוי שלך שבר משהו
4. עדכן את הבדיקה או תקן את הקוד

### Playwright לא עובד?
```bash
# התקן דפדפנים מחדש
npx playwright install --with-deps
```

### Coverage נמוך?
```bash
# ראה איזה קוד לא מכוסה
npm run test:ci
open coverage/lcov-report/index.html
```

---

## 📊 דרישות כיסוי

המינימום הנדרש:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## 🔗 קישורים מהירים

- **[TESTING.md](./TESTING.md)** - מדריך מפורט
- **[TEST_COVERAGE.md](./TEST_COVERAGE.md)** - סיכום כיסוי
- **[TESTS_SUMMARY.md](./TESTS_SUMMARY.md)** - סיכום מה נוצר

---

## 💡 טיפ מקצועי

הוסף alias ל-shell שלך:
```bash
# ~/.zshrc או ~/.bashrc
alias test="npm test"
alias test:all="npm run test:ci && npm run test:e2e"
alias test:watch="npm test"
```

---

**בהצלחה! 🎉**


