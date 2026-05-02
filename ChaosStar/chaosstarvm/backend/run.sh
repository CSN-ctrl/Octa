#!/bin/bash
# Run script for ChaosStar Backend

set -e

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if binary exists
if [ -f "../build/chaosstar-backend" ]; then
    echo "🚀 Running built binary..."
    exec ../build/chaosstar-backend "$@"
else
    echo "🚀 Running with go run..."
    exec go run . "$@"
fi

