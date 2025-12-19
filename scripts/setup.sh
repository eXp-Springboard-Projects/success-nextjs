#!/bin/bash

# SUCCESS.com Setup Script
# Run this script to set up the project for deployment

set -e

echo "🚀 SUCCESS.com Setup Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    echo ""
    echo "Creating .env.local from example..."
    cp .env.production.example .env.local
    echo -e "${YELLOW}⚠️  Please update .env.local with your actual values${NC}"
    echo ""
fi

# Check for required environment variables
echo "Checking environment variables..."
if grep -q "REPLACE_WITH" .env.local; then
    echo -e "${YELLOW}⚠️  Some environment variables need to be set${NC}"
    echo ""
    echo "Run this command to generate NEXTAUTH_SECRET:"
    echo "  openssl rand -base64 32"
    echo ""
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check database connection
echo ""
echo "🗄️  Checking database connection..."
if npx prisma db push --skip-generate --accept-data-loss 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Could not connect to database${NC}"
    echo "This is normal if you haven't set up DATABASE_URL yet"
    echo "You can skip this for now and set it up later"
fi

# Build the project
echo ""
echo "🏗️  Building project..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your values (especially NEXTAUTH_SECRET)"
echo "2. Set up your database and run: npx prisma migrate deploy"
echo "3. Create an admin user (see DEPLOYMENT_QUICK_START.md)"
echo "4. Start dev server: npm run dev"
echo "5. Or deploy to Vercel: vercel --prod"
echo ""
echo "📚 See DEPLOYMENT_QUICK_START.md for detailed instructions"
