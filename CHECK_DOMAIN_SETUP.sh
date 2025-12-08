#!/bin/bash

echo "🌐 בדיקת הגדרות דומיין Production - famnotify.com"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd /Users/zvika/Documents/Family_Notify

echo "📋 Checklist - מה צריך לבדוק:"
echo ""

echo -e "${BLUE}1️⃣ Google Cloud Console:${NC}"
echo "   → https://console.cloud.google.com"
echo "   → APIs & Services > Credentials > OAuth 2.0 Client IDs"
echo "   → Edit > Authorized redirect URIs"
echo ""
echo "   צריך לכלול:"
echo -e "   ${GREEN}✓${NC} https://[YOUR-SUPABASE].supabase.co/auth/v1/callback"
echo -e "   ${GREEN}✓${NC} https://famnotify.com/api/auth/callback"
echo -e "   ${GREEN}✓${NC} https://www.famnotify.com/api/auth/callback"
echo ""

echo -e "${BLUE}2️⃣ Supabase Dashboard:${NC}"
echo "   → https://supabase.com/dashboard"
echo "   → Authentication > URL Configuration"
echo ""
echo "   Site URL:"
echo -e "   ${GREEN}✓${NC} https://famnotify.com"
echo ""
echo "   Redirect URLs:"
echo -e "   ${GREEN}✓${NC} https://famnotify.com/api/auth/callback"
echo -e "   ${GREEN}✓${NC} https://www.famnotify.com/api/auth/callback"
echo ""

echo -e "${BLUE}3️⃣ Vercel (או Hosting אחר):${NC}"
echo "   → https://vercel.com/dashboard"
echo "   → Settings > Domains"
echo ""
echo -e "   ${GREEN}✓${NC} famnotify.com מוגדר ומחובר"
echo -e "   ${GREEN}✓${NC} DNS Records מוגדרים נכון"
echo ""

echo "=================================================="
echo ""

echo "🧪 איך לבדוק:"
echo ""
echo "1. גש ל: https://famnotify.com/login"
echo "2. לחץ 'התחבר עם Google'"
echo "3. בחר חשבון Google"
echo "4. אמור לחזור ל: https://famnotify.com/feed (מחובר!)"
echo ""

echo "=================================================="
echo ""

echo "🐛 אם יש בעיות:"
echo ""
echo "• 'redirect_uri_mismatch' → בדוק שה-URLs ב-Google Console זהים בדיוק"
echo "• הדומיין לא נטען → בדוק DNS Records (יכול לקחת עד 24 שעות)"
echo "• OAuth לא עובד → נקה cookies ונסה שוב"
echo ""

echo "=================================================="
echo ""
echo "📖 קרא את DOMAIN_SETUP.md להסבר מפורט"
echo ""



