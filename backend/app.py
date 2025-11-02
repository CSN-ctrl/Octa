from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import services (works when run from backend directory with uvicorn)
from services.alchemy_service import get_wallet_nfts, get_wallet_balance
from services.supabase_service import upsert_plot, get_plots_for_wallet

# Import contract API (works when run from backend directory)
from contract_api import router as contract_router

app = FastAPI(
    title="Sarakt Land Registry API",
    description="Backend API for Sarakt Land Registry and Contract Management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include contract management routes
app.include_router(contract_router)

@app.get("/")
async def root():
    return {
        "message": "Sarakt Land Registry API",
        "version": "1.0.0",
        "endpoints": {
            "contracts": "/contracts",
            "wallet": "/wallet",
            "plots": "/plots"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

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
