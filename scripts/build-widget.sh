#!/bin/bash

echo "========================================"
echo "Building Metalogics AI Assistant Widget"
echo "========================================"
echo ""

cd widget

echo "[1/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi
echo ""

echo "[2/4] Building widget..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Failed to build widget"
    exit 1
fi
echo ""

echo "[3/4] Verifying build output..."
if [ ! -f "dist/metalogics-widget.js" ]; then
    echo "Error: Build output not found"
    exit 1
fi
echo ""

echo "[4/4] Build complete!"
echo ""
echo "========================================"
echo "Widget built successfully!"
echo "========================================"
echo ""
echo "Output: widget/dist/metalogics-widget.js"
echo ""
echo "Next steps:"
echo "1. Test locally: cd widget && npm run serve"
echo "2. Deploy to CDN"
echo "3. Integrate into website"
echo ""
echo "See widget/QUICKSTART.md for details"
echo ""

cd ..
