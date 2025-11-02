from fastapi import FastAPI, HTTPException
from services.alchemy_service import get_wallet_nfts, get_wallet_balance
from services.supabase_service import upsert_plot, get_plots_for_wallet

app = FastAPI()

@app.get("/wallet/{address}/balance")
async def wallet_balance(address: str):
    bal = await get_wallet_balance(address)
    return {"address": address, "balance": bal}

@app.post("/sync/{address}")
async def sync_nfts(address: str):
    nfts = await get_wallet_nfts(address)
    for nft in nfts:
        token = nft.get("tokenId")
        meta = nft.get("rawMetadata", {})
        upsert_plot(address, token, meta)
    return {"synced": len(nfts)}

@app.get("/plots/{address}")
def plots(address: str):
    return {"plots": get_plots_for_wallet(address)}
