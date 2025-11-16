import os
from web3 import Web3
from eth_account.messages import encode_defunct
from dotenv import load_dotenv
from alchemy_sdk import Alchemy, Network

load_dotenv()

ALCHEMY_KEY = os.getenv("ALCHEMY_KEY")
PRIVATE_KEY = os.getenv("ADMIN_PRIVATE_KEY")

if not ALCHEMY_KEY:
    raise RuntimeError("Missing ALCHEMY_KEY env var")
if not PRIVATE_KEY:
    raise RuntimeError("Missing ADMIN_PRIVATE_KEY env var")

alchemy = Alchemy(
    api_key=ALCHEMY_KEY,
    network=Network.AVALANCHE_MAINNET
)

# Web3 provider via Alchemy RPC
ALCHEMY_AVAX_RPC = f"https://avalanche-mainnet.g.alchemy.com/v2/{ALCHEMY_KEY}"
w3 = Web3(Web3.HTTPProvider(ALCHEMY_AVAX_RPC))

admin_account = w3.eth.account.from_key(PRIVATE_KEY)


def verify_signature(address: str, message: str, signature: str) -> bool:
    msg = encode_defunct(text=message)
    recovered = w3.eth.account.recover_message(msg, signature=signature)
    return recovered.lower() == address.lower()


async def get_wallet_balance(address: str):
    balance = await alchemy.core.get_balance(address)
    return balance


def send_tx(to: str, value_wei: int, gas: int = 21000, gas_price_gwei: int = 25):
    nonce = w3.eth.get_transaction_count(admin_account.address)
    
    tx = {
        "nonce": nonce,
        "to": to,
        "value": value_wei,
        "gas": gas,
        "gasPrice": w3.to_wei(gas_price_gwei, "gwei"),
        "chainId": w3.eth.chain_id
    }

    signed = admin_account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    return tx_hash.hex()


def sign_message(message: str) -> str:
    msg = encode_defunct(text=message)
    s = w3.eth.account.sign_message(msg, private_key=PRIVATE_KEY)
    return s.signature.hex()
