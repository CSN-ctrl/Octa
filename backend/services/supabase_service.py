import os
from typing import Optional
from fastapi import HTTPException

# Optional Supabase integration
supabase = None
try:
    from supabase import create_client
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if url and key:
        supabase = create_client(url, key)
except ImportError:
    # Supabase not installed
    pass
except Exception as e:
    print(f"Warning: Could not initialize Supabase: {e}")

def upsert_plot(wallet, token_id, metadata):
    """Upsert plot data to Supabase"""
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Supabase service not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in environment."
        )
    
    try:
        supabase.table("plots").upsert({
            "wallet": wallet,
            "token_id": token_id,
            "metadata": metadata
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error upserting plot: {str(e)}")

def get_plots_for_wallet(wallet):
    """Get plots for a wallet from Supabase"""
    if not supabase:
        # Return empty list if Supabase not configured
        return []
    
    try:
        result = supabase.table("plots").select("*").eq("wallet", wallet).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching plots: {str(e)}")
