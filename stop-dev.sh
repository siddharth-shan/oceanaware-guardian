#!/bin/bash

###############################################################################
# OceanAware Guardian - Development Server Stop Script
#
# This script stops all running Vite and Node.js development servers
#
# Usage: ./stop-dev.sh
# Or: npm run stop:dev
###############################################################################

echo "🛑 Stopping OceanAware Guardian Development Servers..."
echo ""

# Find and kill Vite processes
VITE_PIDS=$(pgrep -f "vite")
if [ -n "$VITE_PIDS" ]; then
    echo "🔴 Stopping Vite frontend server..."
    kill $VITE_PIDS 2>/dev/null
    echo "✅ Vite stopped"
else
    echo "ℹ️  No Vite processes found"
fi

# Find and kill Node.js server processes (port 3000)
NODE_PIDS=$(lsof -ti:3000)
if [ -n "$NODE_PIDS" ]; then
    echo "🔴 Stopping Express backend server (port 3000)..."
    kill $NODE_PIDS 2>/dev/null
    echo "✅ Express stopped"
else
    echo "ℹ️  No server running on port 3000"
fi

# Find and kill any remaining Node processes related to this project
PROJECT_PIDS=$(pgrep -f "oceanaware-guardian")
if [ -n "$PROJECT_PIDS" ]; then
    echo "🔴 Stopping remaining project processes..."
    kill $PROJECT_PIDS 2>/dev/null
    echo "✅ All processes stopped"
fi

echo ""
echo "✅ OceanAware Guardian development servers stopped"
echo ""
