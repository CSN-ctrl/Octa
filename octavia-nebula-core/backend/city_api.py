from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional
import math

router = APIRouter(prefix="/city", tags=["city"])

# Zones and plots prototype
_zones: Dict[str, Dict] = {
	"residential": {"types": ["hut", "wooden", "stone"]},
	"industrial": {"types": ["workshop"]},
	"business": {"types": ["trading", "brokerage", "market", "arena", "temple"]},
}

_plots: Dict[int, Dict] = {}
_plot_counter = 0

ANNUAL_RENT_GROWTH = 0.036


class PlotCreate(BaseModel):
	zone: Literal["residential", "industrial", "business"]
	subtype: str
	base_rent: float = Field(ge=0.0)
	occupied: bool = False


class OccupancyUpdate(BaseModel):
	plot_id: int
	occupied: bool


class RentProjectionRequest(BaseModel):
	plot_id: int
	years: int = Field(5, ge=1, le=50)


@router.get("/zones")
def list_zones():
	return {"zones": _zones}


@router.post("/plots")
def create_plot(req: PlotCreate):
	global _plot_counter
	if req.subtype not in _zones[req.zone]["types"]:
		raise HTTPException(status_code=400, detail="Invalid subtype for zone")
	_plot_counter += 1
	plot = {
		"id": _plot_counter,
		"zone": req.zone,
		"type": req.subtype,
		"base_rent": req.base_rent,
		"occupied": req.occupied,
	}
	_plots[_plot_counter] = plot
	return {"plot": plot}


@router.get("/plots")
def list_plots():
	return {"plots": list(_plots.values())}


@router.post("/plots/occupancy")
def set_occupancy(update: OccupancyUpdate):
	plot = _plots.get(update.plot_id)
	if not plot:
		raise HTTPException(status_code=404, detail="Plot not found")
	plot["occupied"] = update.occupied
	return {"plot": plot}


@router.post("/plots/project-rent")
def project_rent(req: RentProjectionRequest):
	plot = _plots.get(req.plot_id)
	if not plot:
		raise HTTPException(status_code=404, detail="Plot not found")
	rents = []
	r = plot["base_rent"]
	for year in range(1, req.years + 1):
		r *= (1.0 + ANNUAL_RENT_GROWTH)
		rents.append({"year": year, "rent": round(r, 2)})
	return {"plot_id": req.plot_id, "annual_growth": ANNUAL_RENT_GROWTH, "rents": rents}


