from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import uuid

router = APIRouter(prefix="/governance", tags=["governance"])

_factions: Dict[str, Dict] = {}
_policies: Dict[str, Dict] = {}
_black_market = {"invite_only": True, "liquidity": {"XMR": 0.0, "SC": 0.0}}


class FactionCreate(BaseModel):
	name: str
	description: Optional[str] = None


class PolicySet(BaseModel):
	key: str
	value: str
	scope: str = Field("city", description="city/system/planet")


class LiquidityUpdate(BaseModel):
	asset: str
	amount: float


@router.post("/factions")
def create_faction(req: FactionCreate):
	fid = str(uuid.uuid4())
	_factions[fid] = {"id": fid, "name": req.name, "description": req.description, "members": 0}
	return {"faction": _factions[fid]}


@router.get("/factions")
def list_factions():
	return {"factions": list(_factions.values())}


@router.post("/policies")
def set_policy(req: PolicySet):
	_policies[req.key] = {"key": req.key, "value": req.value, "scope": req.scope}
	return {"policy": _policies[req.key]}


@router.get("/policies")
def list_policies():
	return {"policies": list(_policies.values())}


@router.get("/black-market")
def black_market_status():
	return _black_market


@router.post("/black-market/liquidity")
def update_liquidity(upd: LiquidityUpdate):
	if upd.asset not in _black_market["liquidity"]:
		_black_market["liquidity"][upd.asset] = 0.0
	_black_market["liquidity"][upd.asset] = max(0.0, _black_market["liquidity"][upd.asset] + upd.amount)
	return {"liquidity": _black_market["liquidity"]}


