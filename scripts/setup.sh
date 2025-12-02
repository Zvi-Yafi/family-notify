#!/bin/bash

echo "🚀 Setting up FamilyNotify..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example.txt .env.local
    echo "✅ .env.local created"
    echo "⚠️  Please edit .env.local with your credentials"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
yarn prisma:generate

# Generate VAPID keys if not exists
if [ ! -f vapid-keys.json ]; then
    echo "🔑 Generating VAPID keys..."
    node scripts/generate-vapid.js
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Supabase and Resend credentials"
echo "2. Run: yarn prisma db push (to create database tables)"
echo "3. Run: yarn prisma:seed (to add demo data)"
echo "4. Run: yarn dev (to start development server)"
echo ""
echo "📚 See QUICKSTART.md for detailed instructions"



