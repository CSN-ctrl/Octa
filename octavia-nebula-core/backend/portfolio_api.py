from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import math

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

# Prototype portfolios by wallet
_portfolios: Dict[str, Dict] = {}


class Holding(BaseModel):
	asset_type: str  # "plot", "building", "token"
	identifier: str
	cost_basis: float = 0.0
	yield_annual: float = 0.0


class PortfolioUpsert(BaseModel):
	wallet: str
	holdings: List[Holding] = []
	recurring_investment_monthly: float = 0.0
	manager_id: Optional[str] = None
	portfolio_type: Optional[str] = None  # "primary" | "secondary"


class ProjectionRequest(BaseModel):
	wallet: str
	years: int = Field(5, ge=1, le=50)
	expected_annual_return: float = Field(0.07, ge=-1.0, le=5.0)


@router.post("/upsert")
def upsert_portfolio(p: PortfolioUpsert):
	_portfolios[p.wallet] = p.model_dump()
	return {"portfolio": _portfolios[p.wallet]}


@router.get("/{wallet}")
def get_portfolio(wallet: str):
	return {"portfolio": _portfolios.get(wallet, {"wallet": wallet, "holdings": [], "recurring_investment_monthly": 0.0})}


@router.get("/{wallet}/loans")
def get_loan_eligibility(wallet: str):
	p = _portfolios.get(wallet)
	total_plots = sum(1 for h in (p["holdings"] if p else []) if h["asset_type"] == "plot")
	eligible = total_plots >= 5
	return {"eligible": eligible, "interest_rate": 0.025 if eligible else None, "criteria": "5 owned plots"}


@router.post("/project")
def project_portfolio(req: ProjectionRequest):
	p = _portfolios.get(req.wallet, {"holdings": [], "recurring_investment_monthly": 0.0})
	monthly = p.get("recurring_investment_monthly", 0.0)
	holdings_value = sum(h["cost_basis"] for h in p.get("holdings", []))

	# Compound monthly contributions at expected annual return
	r = req.expected_annual_return
	rm = (1 + r) ** (1 / 12) - 1
	months = req.years * 12
	fv_contrib = monthly * (((1 + rm) ** months - 1) / rm) if rm != 0 else monthly * months
	fv_holdings = holdings_value * ((1 + r) ** req.years)

	return {
		"wallet": req.wallet,
		"years": req.years,
		"expected_annual_return": r,
		"future_value_contributions": round(fv_contrib, 2),
		"future_value_holdings": round(fv_holdings, 2),
		"future_value_total": round(fv_contrib + fv_holdings, 2),
	}


