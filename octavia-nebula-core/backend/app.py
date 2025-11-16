from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import services (works when run from backend directory with uvicorn)
from services.alchemy_service import get_wallet_nfts, get_wallet_balance
from services.supabase_service import upsert_plot, get_plots_for_wallet

# Import contract API (works when run from backend directory)
from contract_api import router as contract_router
from economy_api import router as economy_router
from npc_api import router as npc_router
from city_api import router as city_router
from governance_api import router as governance_router
from portfolio_api import router as portfolio_router
from managers_api import router as managers_router
from document_api import router as document_router

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

# Include routers
app.include_router(contract_router)
app.include_router(economy_router)
app.include_router(npc_router)
app.include_router(city_router)
app.include_router(governance_router)
app.include_router(portfolio_router)
app.include_router(managers_router)
app.include_router(document_router)

@app.get("/")
async def root():
    return {
        "message": "Sarakt Land Registry API",
        "version": "1.0.0",
        "endpoints": {
            "contracts": "/contracts",
            "economy": "/economy",
            "npcs": "/npcs",
            "city": "/city",
            "governance": "/governance",
            "portfolio": "/portfolio",
            "managers": "/managers",
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
