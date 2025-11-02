from supabase import create_client
import os

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(url, key)

def upsert_plot(wallet, token_id, metadata):
    supabase.table("plots").upsert({
        "wallet": wallet,
        "token_id": token_id,
        "metadata": metadata
    }).execute()

def get_plots_for_wallet(wallet):
    return supabase.table("plots").select("*").eq("wallet", wallet).execute().data
