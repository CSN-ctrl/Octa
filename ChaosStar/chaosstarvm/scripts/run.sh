#!/usr/bin/env bash
# Copyright (C) 2024, ChaosStar Network. All rights reserved.
# ChaosStarVM - Run local network

set -e

# to run E2E tests (terminates cluster afterwards)
# MODE=test ./scripts/run.sh
MODE=${MODE:-run}

# Ensure the chaosstarvm root as the working directory
cd "$(dirname "${BASH_SOURCE[0]}")" && cd ..

# Set paths
HYPERSDK_DIR="$(cd ../hypersdk && pwd)"
AVALANCHEGO_PATH="${HYPERSDK_DIR}/scripts/run_avalanchego.sh"
AVALANCHEGO_PLUGIN_DIR="${HYPERSDK_DIR}/build/plugins"
mkdir -p "${AVALANCHEGO_PLUGIN_DIR}"

# Get VM ID
VMID="knEkzfTQcfvFBYVmARqe8y4fv7c8HsuAhF1tAMYdBRT4yEo3k"

echo "Building ChaosStarVM..."
CGO_CFLAGS="-O2 -D__BLST_PORTABLE__" go build -o "${AVALANCHEGO_PLUGIN_DIR}/${VMID}" ./cmd/chaosstarvm

echo "VM built successfully!"
echo "VM ID: ${VMID}"
echo "Plugin location: ${AVALANCHEGO_PLUGIN_DIR}/${VMID}"

# Also copy to avalanche-cli plugins directory for CLI usage
AVALANCHE_CLI_PLUGINS="$HOME/.avalanche-cli/plugins"
mkdir -p "${AVALANCHE_CLI_PLUGINS}"
cp "${AVALANCHEGO_PLUGIN_DIR}/${VMID}" "${AVALANCHE_CLI_PLUGINS}/${VMID}"
chmod +x "${AVALANCHE_CLI_PLUGINS}/${VMID}"
echo "Also installed to: ${AVALANCHE_CLI_PLUGINS}/${VMID}"

# Copy to both avalanchego versions
for version in v1.13.0 v1.14.0; do
    VERSIONED_PLUGINS="$HOME/.avalanche-cli/bin/avalanchego/avalanchego-${version}/plugins"
    if [ -d "$HOME/.avalanche-cli/bin/avalanchego/avalanchego-${version}" ]; then
        mkdir -p "${VERSIONED_PLUGINS}"
        cp "${AVALANCHEGO_PLUGIN_DIR}/${VMID}" "${VERSIONED_PLUGINS}/${VMID}"
        chmod +x "${VERSIONED_PLUGINS}/${VMID}"
        echo "Installed to avalanchego ${version} plugins"
    fi
done

echo ""
echo "=============================================="
echo "ChaosStarVM Ready!"
echo "=============================================="
echo ""
echo "To test the VM, use one of these methods:"
echo ""
echo "1. Using avalanche-cli (recommended):"
echo "   avalanche network start"
echo "   avalanche blockchain deploy chaosstar --local"
echo ""
echo "2. Direct VM test:"
echo "   ./build/chaosstarvm version"
echo ""
