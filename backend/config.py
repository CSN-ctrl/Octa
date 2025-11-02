import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

AVALANCHE_RPC = os.getenv("VITE_AVALANCHE_RPC") or "http://127.0.0.1:9650/ext/bc/ChaosStarNetwork/rpc"
LAND_CONTRACT = os.getenv("VITE_CONTRACT_ADDRESS")
PINATA_JWT = os.getenv("VITE_PINATA_JWT")
PINATA_API_KEY = os.getenv("VITE_PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("VITE_PINATA_SECRET_KEY")

# Auto-load private key from environment or Avalanche CLI
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

# If PRIVATE_KEY not set, try to load from Avalanche CLI
if not PRIVATE_KEY:
    try:
        # Try relative import first (when used as module), then absolute
        try:
            from .avalanche_key_loader import auto_load_funded_account_key
        except ImportError:
            from backend.avalanche_key_loader import auto_load_funded_account_key
        
        subnet_name = os.getenv("AVALANCHE_SUBNET_NAME", "ChaosStarNetwork")
        PRIVATE_KEY = auto_load_funded_account_key(
            subnet_name=subnet_name,
            rpc_url=AVALANCHE_RPC,
            silent=False
        )
        if PRIVATE_KEY:
            # Get account address for display
            from eth_account import Account
            account = Account.from_key(PRIVATE_KEY)
            print(f"✓ Automatically loaded private key from Avalanche CLI ({subnet_name})")
            print(f"  Account: {account.address}")
    except Exception as e:
        # Only show warning if in verbose mode or if it's not an import error
        import sys
        if "--verbose" in sys.argv or "-v" in sys.argv or not isinstance(e, ImportError):
            print(f"⚠ Could not auto-load key from Avalanche CLI: {e}")
        PRIVATE_KEY = None

CHAIN_ID = 8987
GAS_LIMIT = 300000
PLOT_PRICE = 0.1

# Try to load contract addresses from deployments
def load_contract_addresses():
    """Load contract addresses from deployments/addresses.json"""
    project_root = Path(__file__).parent.parent
    addresses_file = project_root / "deployments" / "addresses.json"
    
    if addresses_file.exists():
        with open(addresses_file, 'r') as f:
            addresses = json.load(f)
            return addresses.get("land") or LAND_CONTRACT, addresses
    return LAND_CONTRACT, {}

# Load addresses
LAND_CONTRACT, _ = load_contract_addresses()

# ABI paths
CONTRACT_ABI_PATH = "backend/abi/SaraktLandV2ABI.json"
DIGITAL_ID_ABI_PATH = "backend/abi/SaraktDigitalIDABI.json"
TREASURY_ABI_PATH = "backend/abi/SaraktTreasuryABI.json"