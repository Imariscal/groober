#!/bin/bash
# ============================================
# VIBRALIVE - Startup Verification Script
# Checks configuration before starting servers
# ============================================

echo "🔍 Checking VibraLive Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check Frontend
echo "📋 Checking Frontend Configuration..."
if [ -f "vibralive-frontend/.env.local" ]; then
    echo "  ✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_API_URL=http://localhost:3001" vibralive-frontend/.env.local; then
        echo "  ${RED}❌ ERROR: .env.local has NEXT_PUBLIC_API_URL=http://localhost:3001${NC}"
        echo "     This will cause CORS. Don't set this variable!"
        ERRORS=$((ERRORS+1))
    fi
    if grep -q "NEXT_PUBLIC_ROUTE_OPTIMIZER_URL=http://localhost:8001" vibralive-frontend/.env.local; then
        echo "  ✅ Route optimizer URL is set"
    fi
else
    echo "  ${RED}❌ .env.local not found${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check next.config.js
echo ""
echo "📋 Checking Next.js Configuration..."
if grep -q "source: '/api/:path\*'" vibralive-frontend/next.config.js; then
    echo "  ✅ API proxy is configured"
    if grep -q "destination:.*localhost:3001" vibralive-frontend/next.config.js; then
        echo "  ✅ Proxy points to localhost:3001"
    fi
else
    echo "  ${RED}❌ API proxy not configured in next.config.js${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check Backend
echo ""
echo "📋 Checking Backend Configuration..."
if [ -f "vibralive-backend/.env" ]; then
    echo "  ✅ .env exists"
    if grep -q "CORS_ORIGIN=.*localhost:3000" vibralive-backend/.env; then
        echo "  ✅ CORS allows localhost:3000"
    else
        echo "  ${RED}❌ CORS not configured for localhost:3000${NC}"
        ERRORS=$((ERRORS+1))
    fi
    if grep -q "API_PORT=3001" vibralive-backend/.env; then
        echo "  ✅ Backend port is 3001"
    fi
else
    echo "  ${RED}❌ Backend .env not found${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check main.ts for CORS
echo ""
echo "📋 Checking Backend CORS Setup..."
if grep -q "app.enableCors" vibralive-backend/src/main.ts; then
    echo "  ✅ CORS is enabled in main.ts"
else
    echo "  ${YELLOW}⚠️  CORS may not be enabled in main.ts${NC}"
fi

# Summary
echo ""
echo "============================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All configurations look good!${NC}"
    echo ""
    echo "Ready to start:"
    echo "  1. cd vibralive-backend && npm run start:dev"
    echo "  2. cd vibralive-frontend && npm run dev"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS configuration errors${NC}"
    echo ""
    echo "Please fix the issues above before starting."
    exit 1
fi
