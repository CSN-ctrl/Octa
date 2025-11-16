from supabase import create_client
import config

# Initialize Supabase client with service role key (backend only!)
supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

def get_users():
    """Return all users from Supabase 'users' table."""
    response = supabase.table("users").select("*").execute()
    if response.error:
        raise Exception(f"Supabase error: {response.error}")
    return response.data

def add_user(user_data: dict):
    """Add a new user to Supabase."""
    response = supabase.table("users").insert(user_data).execute()
    if response.error:
        raise Exception(f"Supabase error: {response.error}")
    return response.data
