#!/bin/bash

###############################################################################
# OceanAware Guardian - Development Server Start Script
#
# This script starts both the frontend (Vite) and backend (Express) servers
# for local development and testing.
#
# Usage: ./start-dev.sh
# Or: npm run start:dev
###############################################################################

echo "🌊 Starting OceanAware Guardian Development Environment..."
echo ""
echo "================================================"
echo "  OceanAware Guardian - Ocean Conservation Platform"
echo "  Bow Seat Ocean Awareness Contest 2026"
echo "================================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Running npm install..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "⚠️  server/node_modules not found. Running npm install..."
    cd server && npm install && cd ..
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Copying from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please configure your API keys"
fi

echo ""
echo "🚀 Starting Development Server..."
echo ""
echo "📱 Frontend (Vite):  http://localhost:5173"
echo ""
echo "⚠️  Note: Backend server optional for Phase 3-4 features"
echo "   (Most features work with frontend only + mock data)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "================================================"
echo ""

# Start frontend server (backend is optional for current features)
npm run dev

# Uncomment below to start both servers:
# npm run dev:all
