#!/bin/bash

# Metalogics Chatbot Widget - Build and Test Script
# This script builds the widget and starts a local server for testing

set -e  # Exit on error

echo "🚀 Metalogics Chatbot Widget - Build & Test"
echo "==========================================="
echo ""

# Check if we're in the widget directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the widget directory:"
    echo "  cd widget && ./build-and-test.sh"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Build the widget
echo "🔨 Building widget..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    
    # Show file sizes
    echo "📊 Build Output:"
    echo "----------------"
    if [ -f "dist/metalogics-chatbot.iife.js" ]; then
        JS_SIZE=$(du -h dist/metalogics-chatbot.iife.js | cut -f1)
        echo "  metalogics-chatbot.iife.js: $JS_SIZE"
    fi
    if [ -f "dist/metalogics-chatbot.css" ]; then
        CSS_SIZE=$(du -h dist/metalogics-chatbot.css | cut -f1)
        echo "  metalogics-chatbot.css: $CSS_SIZE"
    fi
    echo ""
    
    # Ask if user wants to test
    echo "🧪 Would you like to start the test server? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "🌐 Starting test server..."
        echo "📍 Open http://localhost:4173 in your browser"
        echo "Press Ctrl+C to stop the server"
        echo ""
        npm run serve
    else
        echo ""
        echo "✅ Build complete! Files are in the dist/ folder"
        echo ""
        echo "Next steps:"
        echo "1. Upload dist/metalogics-chatbot.iife.js to your CDN"
        echo "2. Upload dist/metalogics-chatbot.css to your CDN"
        echo "3. Add the integration code to your website"
        echo ""
        echo "See INTEGRATION_GUIDE.md for detailed instructions"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
