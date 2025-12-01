#!/usr/bin/env bash
# Copyright (C) 2024, ChaosStar Network. All rights reserved.
# Deploy ChaosStarVM to a local Avalanche network

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR=$(dirname "$SCRIPT_DIR")
BUILD_DIR="${PROJECT_DIR}/build"

VM_NAME="chaosstarvm"
CHAIN_NAME="${CHAIN_NAME:-chaosstar}"

# Check if avalanche-cli is installed
if ! command -v avalanche &> /dev/null; then
    echo "Error: avalanche-cli is not installed"
    echo "Install with: curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s"
    exit 1
fi

# Build the VM
"${SCRIPT_DIR}/build.sh"

# Create the blockchain using avalanche-cli
echo "Creating blockchain ${CHAIN_NAME}..."

# Check if chain already exists
if avalanche blockchain describe "$CHAIN_NAME" &> /dev/null; then
    echo "Blockchain ${CHAIN_NAME} already exists. Updating VM..."
else
    echo "Creating new blockchain ${CHAIN_NAME}..."
    avalanche blockchain create "$CHAIN_NAME" \
        --vm "$VM_NAME" \
        --genesis "${PROJECT_DIR}/genesis/genesis.json" \
        --force
fi

echo ""
echo "Deploying to local network..."
avalanche blockchain deploy "$CHAIN_NAME" --local

echo ""
echo "ChaosStarVM deployed successfully!"
echo "Use 'avalanche blockchain describe ${CHAIN_NAME}' to see details."


