#!/usr/bin/env python3
"""
Command-line interface for managing smart contracts
Usage:
    python scripts/manage_contracts.py status
    python scripts/manage_contracts.py deploy
    python scripts/manage_contracts.py compile
    python scripts/manage_contracts.py verify
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

from backend.contract_manager import ContractManager
import json


def print_status(manager: ContractManager):
    """Print deployment status"""
    status = manager.get_deployment_status()
    
    print("\n" + "="*60)
    print("CONTRACT DEPLOYMENT STATUS")
    print("="*60 + "\n")
    
    for name, info in status.items():
        icon = "✓" if info["deployed"] else "✗"
        status_text = "DEPLOYED" if info["deployed"] else "NOT DEPLOYED"
        
        print(f"{icon} {name:20s} {status_text}")
        if info["address"]:
            print(f"  Address: {info['address']}")
        print()
    
    print("="*60 + "\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/manage_contracts.py <command>")
        print("Commands: status, deploy, compile, verify")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    try:
        manager = ContractManager()
        
        if command == "status":
            print_status(manager)
            addresses = manager.addresses
            if addresses:
                print("Deployed Addresses:")
                print(json.dumps(addresses, indent=2))
        
        elif command == "compile":
            print("Compiling contracts...")
            if manager.compile_contracts():
                print("✓ Compilation successful!")
                # Extract ABIs
                contracts = ["SaraktDigitalID", "SaraktTreasury", "SaraktLandV2", "DummyToken"]
                print("\nExtracting ABIs...")
                for contract_name in contracts:
                    abi = manager.extract_abi(contract_name)
                    if abi:
                        manager.save_abi(contract_name, abi)
                        print(f"  ✓ {contract_name}")
            else:
                print("✗ Compilation failed!")
                sys.exit(1)
        
        elif command == "deploy":
            print("Starting contract deployment...")
            result = manager.setup_and_deploy()
            
            if result["status"] == "error":
                print(f"✗ Deployment failed: {result.get('error', 'Unknown error')}")
                sys.exit(1)
            elif result["status"] == "deployed":
                print("\n✓ All contracts deployed successfully!")
                print("\nDeployed Addresses:")
                print(json.dumps(result["addresses"], indent=2))
            else:
                print(f"\n⚠ Deployment status: {result['status']}")
        
        elif command == "verify":
            print("Verifying contracts...")
            verification = manager.verify_contracts()
            
            print("\nVerification Results:")
            print("="*60)
            for name, verified in verification.items():
                icon = "✓" if verified else "✗"
                status = "VERIFIED" if verified else "FAILED"
                print(f"{icon} {name:20s} {status}")
        
        else:
            print(f"Unknown command: {command}")
            print("Available commands: status, deploy, compile, verify")
            sys.exit(1)
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

