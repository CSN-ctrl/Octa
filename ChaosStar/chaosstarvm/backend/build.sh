#!/bin/bash
# Build script for ChaosStar Backend

set -e

echo "🔨 Building ChaosStar Backend..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Download dependencies
echo "📦 Downloading dependencies..."
go mod download
go mod tidy

# Build the binary
echo "🏗️ Building binary..."
go build -o ../build/chaosstar-backend .

echo "✅ Build complete: ../build/chaosstar-backend"
echo ""
echo "Run with: ../build/chaosstar-backend"
echo "Or: go run ."

