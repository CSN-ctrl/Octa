import os
from dotenv import load_dotenv

load_dotenv()

AVALANCHE_RPC = os.getenv("AVALANCHE_RPC")
LAND_CONTRACT = os.getenv("LAND_CONTRACT")
PINATA_JWT = os.getenv("PINATA_JWT")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CHAIN_ID = int(os.getenv("CHAIN_ID", "8987"))
GAS_LIMIT = 300000
PLOT_PRICE = 0.1  # AVAX
CONTRACT_ABI_PATH = "backend/abi/YourContractABI.json"