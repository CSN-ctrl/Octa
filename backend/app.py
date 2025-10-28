from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .blockchain import BlockchainService
from .pinata_async import PinataService
from .deed import DeedGenerator

app = FastAPI()
bc = BlockchainService()
pinata = PinataService()
deed_gen = DeedGenerator()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PurchaseRequest(BaseModel):
    plot_id: int
    owner: str
    value_eth: float

@app.post("/api/purchase")
async def purchase_plot(req: PurchaseRequest):
    try:
        tx_hash = bc.buy_plot_tx(req.plot_id, req.value_eth)
        pdf_bytes = deed_gen.generate_deed(req.plot_id, req.owner, tx_hash)
        return {"tx_hash": tx_hash, "deed_pdf": pdf_bytes.getvalue().hex()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))