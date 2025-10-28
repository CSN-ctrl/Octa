import os
from dotenv import load_dotenv

load_dotenv()

AVALANCHE_RPC = os.getenv("VITE_AVALANCHE_RPC")
LAND_CONTRACT = os.getenv("VITE_CONTRACT_ADDRESS")
PINATA_JWT = os.getenv("VITE_PINATA_JWT")
PINATA_API_KEY = os.getenv("VITE_PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("VITE_PINATA_SECRET_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")  # Set this in your backend .env
CHAIN_ID = 8987
GAS_LIMIT = 300000
PLOT_PRICE = 0.1
CONTRACT_ABI_PATH = "backend/abi/YourContractABI.json"