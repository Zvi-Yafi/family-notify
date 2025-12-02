# תרומה לפרויקט FamilyNotify

תודה על העניין לתרום לפרויקט! 🎉

## 📋 דרכים לתרום

- דיווח על באגים
- הצעות לתכונות חדשות
- שיפור תיעוד
- תיקון קוד
- תרגום לשפות נוספות

## 🚀 התחלה מהירה

### 1. Fork & Clone

\`\`\`bash
git clone https://github.com/YOUR-USERNAME/family-notify.git
cd family-notify
\`\`\`

### 2. הגדרת סביבת פיתוח

\`\`\`bash
yarn install
cp env.example.txt .env.local
# ערכו את .env.local עם הפרטים שלכם
yarn prisma:generate
yarn prisma db push
yarn prisma:seed
\`\`\`

### 3. צרו branch חדש

\`\`\`bash
git checkout -b feature/your-feature-name
# או
git checkout -b fix/bug-description
\`\`\`

## 💻 סטנדרטים לקוד

### TypeScript

- השתמשו בטיפוסים מפורשים
- הימנעו מ-\`any\` אלא אם הכרחי
- השתמשו ב-interfaces לאובייקטים

### React

- רכיבים פונקציונליים בלבד
- השתמשו ב-hooks
- שמות רכיבים ב-PascalCase
- שמות קבצים: \`ComponentName.tsx\`

### Styling

- TailwindCSS בלבד
- RTL support חובה
- Dark mode support

### API Routes

- תיעוד ברור
- Error handling מלא
- Validation עם Zod
- Rate limiting כשנדרש

## 🧪 Testing

\`\`\`bash
# Lint
yarn lint

# Type check
yarn tsc --noEmit

# Build
yarn build
\`\`\`

## 📝 Commit Messages

השתמשו בפורמט זה:

\`\`\`
type(scope): subject

body (optional)
\`\`\`

**Types:**
- feat: תכונה חדשה
- fix: תיקון באג
- docs: שינויים בתיעוד
- style: עיצוב (לא משפיע על פונקציונליות)
- refactor: שיפור קוד
- test: הוספת טסטים
- chore: משימות תחזוקה

**דוגמאות:**
\`\`\`
feat(notifications): add WhatsApp support
fix(auth): resolve login redirect issue
docs(readme): update installation steps
\`\`\`

## 🔄 Pull Request Process

1. ודאו שהקוד עובר את כל הבדיקות
2. עדכנו את התיעוד אם רלוונטי
3. הוסיפו screenshots לשינויי UI
4. תארו מה שינוי זה משנה ולמה

### PR Template

\`\`\`markdown
## תיאור
מה ה-PR הזה משנה?

## סוג השינוי
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## איך לבדוק?
1. ...
2. ...

## Screenshots (אם רלוונטי)

## Checklist
- [ ] הקוד עובר lint
- [ ] הקוד עובר type check
- [ ] בדקתי ידנית
- [ ] עדכנתי תיעוד
\`\`\`

## 🐛 דיווח על באגים

פתחו Issue עם:

1. **כותרת ברורה**
2. **תיאור המצב הנוכחי**
3. **מה היה צריך לקרות**
4. **שלבים לשחזור:**
   - שלב 1
   - שלב 2
   - ...
5. **סביבה:**
   - OS: [e.g. macOS 13]
   - Browser: [e.g. Chrome 120]
   - Node version: [e.g. 18.17.0]
6. **Screenshots / Logs**

## 💡 הצעות לתכונות

פתחו Issue עם:

1. **כותרת ברורה**
2. **הבעיה שהתכונה פותרת**
3. **הפתרון המוצע**
4. **אלטרנטיבות שנבדקו**
5. **מוכנות לממש בעצמך?**

## 🌍 תרגום

אם ברצונכם להוסיף שפה:

1. צרו קובץ \`locales/[lang].json\`
2. תרגמו את כל המפתחות
3. הוסיפו את השפה ל-\`i18n.config.ts\`
4. בדקו RTL/LTR

## 📞 יצירת קשר

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Email: contribute@familynotify.com

## 📜 Code of Conduct

- היו מכבדים
- היו סבלניים
- היו constructive
- אין לשנאה, אפליה או harassment

## 🎖️ Contributors

תודה לכל התורמים! ⭐

---

שוב תודה על התרומה! 💙



