#!/usr/bin/env bash
# Copyright (C) 2024, ChaosStar Network. All rights reserved.
# Build script for ChaosStarVM

set -euo pipefail

# Get the directory of this script
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR=$(dirname "$SCRIPT_DIR")

# Build configuration
VM_NAME="chaosstarvm"
CLI_NAME="chaosstar-cli"
VERSION="${VERSION:-1.0.0}"

# Output directories
BUILD_DIR="${PROJECT_DIR}/build"
mkdir -p "$BUILD_DIR"

echo "Building ChaosStarVM v${VERSION}..."

# Build the VM
echo "  -> Building ${VM_NAME}..."
go build -o "${BUILD_DIR}/${VM_NAME}" \
    -ldflags "-X github.com/ava-labs/hypersdk/examples/morpheusvm/cmd/chaosstarvm/version.Version=${VERSION}" \
    "${PROJECT_DIR}/cmd/chaosstarvm"

echo "  -> Building ${CLI_NAME}..."
go build -o "${BUILD_DIR}/${CLI_NAME}" \
    "${PROJECT_DIR}/cmd/chaosstar-cli"

echo ""
echo "Build complete!"
echo "  VM binary:  ${BUILD_DIR}/${VM_NAME}"
echo "  CLI binary: ${BUILD_DIR}/${CLI_NAME}"
echo ""
echo "To install the VM to AvalancheGo plugins directory:"
echo "  cp ${BUILD_DIR}/${VM_NAME} ~/.avalanchego/plugins/<vm-id>"


