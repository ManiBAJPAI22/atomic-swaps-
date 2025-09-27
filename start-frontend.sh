#!/bin/bash

echo "🚀 Starting Atomic Swap Frontend..."

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the atomic-swap-cli directory"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Start the frontend
echo "🌐 Starting React development server..."
npm start
