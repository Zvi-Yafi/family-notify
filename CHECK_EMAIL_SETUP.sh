#!/bin/bash

echo "📧 בדיקת הגדרות Email (Resend)"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /Users/zvika/Documents/Family_Notify

echo "1️⃣ בדיקת משתני סביבה:"
echo ""

check_env_var() {
    var_name=$1
    if grep -q "^${var_name}=" .env.local 2>/dev/null || grep -q "^${var_name}=" .env 2>/dev/null; then
        value=$(grep "^${var_name}=" .env.local 2>/dev/null || grep "^${var_name}=" .env 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d '"')
        if [ -n "$value" ] && [ "$value" != "[YOUR-KEY]" ] && [ "$value" != "re_" ]; then
            if [[ "$value" == re_* ]]; then
                echo -e "${GREEN}✅ $var_name מוגדר${NC}"
                echo "   Key מתחיל ב-re_ (נכון!)"
            else
                echo -e "${YELLOW}⚠️  $var_name מוגדר אבל לא נראה כמו Resend key${NC}"
            fi
        else
            echo -e "${RED}❌ $var_name קיים אבל ריק או placeholder${NC}"
        fi
    else
        echo -e "${RED}❌ $var_name חסר${NC}"
    fi
}

check_env_var "RESEND_API_KEY"

echo ""
check_env_var "RESEND_FROM_EMAIL"

echo ""
echo "=================================="
echo ""
echo "🧪 איך לבדוק:"
echo ""
echo "1. רסטרט את השרת:"
echo "   Ctrl+C"
echo "   npm run dev"
echo ""
echo "2. גש לדף הבדיקה:"
echo "   http://localhost:3002/test-email"
echo ""
echo "3. הזן כתובת אימייל ולחץ 'שלח אימייל בדיקה'"
echo ""
echo "4. בדוק את תיבת הדואר הנכנס!"
echo ""
echo "=================================="
echo ""
echo "📝 טיפים:"
echo ""
echo "• אם האימייל לא מגיע - בדוק גם ב-spam"
echo "• ודא שה-From address נכון ב-RESEND_FROM_EMAIL"
echo "• אם יש שגיאה - בדוק את הקונסול (Terminal)"
echo ""
