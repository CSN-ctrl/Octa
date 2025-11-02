from alchemy_sdk import Alchemy, Network
import os

alchemy = Alchemy(
    api_key=os.getenv("ALCHEMY_KEY"),
    network=Network.AVALANCHE_MAINNET
)

async def get_wallet_nfts(address: str):
    data = await alchemy.nft.get_nfts_for_owner(address)
    return data.get("ownedNfts", [])

async def get_wallet_balance(address: str):
    bal = await alchemy.core.get_balance(address)
    return bal
