#!/bin/bash

echo "🔍 בדיקת הגדרות Google Authentication"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /Users/zvika/Documents/Family_Notify

echo "1️⃣ בדיקת קבצי הגדרות:"
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ .env.local קיים${NC}"
else
    echo -e "${RED}❌ .env.local חסר${NC}"
fi

if [ -f .env ]; then
    echo -e "${GREEN}✅ .env קיים${NC}"
else
    echo -e "${RED}❌ .env חסר${NC}"
fi

echo ""
echo "2️⃣ בדיקת משתני סביבה (ללא חשיפת ערכים):"

check_env_var() {
    var_name=$1
    # Check in both .env and .env.local
    if grep -q "^${var_name}=" .env.local 2>/dev/null || grep -q "^${var_name}=" .env 2>/dev/null; then
        value=$(grep "^${var_name}=" .env.local 2>/dev/null || grep "^${var_name}=" .env 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d '"')
        if [ -n "$value" ] && [ "$value" != "[YOUR-KEY]" ] && [ "$value" != "[PROJECT-REF]" ]; then
            echo -e "${GREEN}✅ $var_name מוגדר${NC}"
        else
            echo -e "${YELLOW}⚠️  $var_name קיים אבל ריק או placeholder${NC}"
        fi
    else
        echo -e "${RED}❌ $var_name חסר${NC}"
    fi
}

echo ""
echo "📌 משתני Supabase (חובה):"
check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_var "SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "📌 Database:"
check_env_var "DATABASE_URL"

echo ""
echo "📌 Email Provider:"
check_env_var "RESEND_API_KEY"

echo ""
echo "======================================"
echo ""
echo "🔧 מה צריך לעשות להפעלת Google Auth:"
echo ""
echo "1. עבור ל-Google Cloud Console:"
echo "   https://console.cloud.google.com"
echo ""
echo "2. צור OAuth 2.0 Client ID ב-APIs & Services > Credentials"
echo ""
echo "3. הוסף Authorized redirect URIs:"
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null || grep "^NEXT_PUBLIC_SUPABASE_URL=" .env 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d '"')
if [ -n "$SUPABASE_URL" ]; then
    echo "   ${SUPABASE_URL}/auth/v1/callback"
else
    echo "   https://[YOUR-PROJECT].supabase.co/auth/v1/callback"
fi
echo "   http://localhost:3002/api/auth/callback"
echo ""
echo "4. עבור ל-Supabase Dashboard:"
echo "   https://supabase.com/dashboard"
echo "   → Authentication → Providers → Google"
echo "   → הפעל והזן Client ID & Secret מ-Google"
echo ""
echo "5. אחרי הגדרה - גש לדף הבדיקה:"
echo "   http://localhost:3002/test-auth"
echo ""
