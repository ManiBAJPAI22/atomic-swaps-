#!/bin/bash

echo "🚀 Starting Atomic Swap Backend..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the atomic-swap-cli directory"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Build the backend
echo "🔨 Building backend..."
npm run build

# Start the backend
echo "⚡ Starting backend server..."
npm start
