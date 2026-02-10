import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def inspect_auth():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = create_client(url, key)

    try:
        # Check if we can access auth.users (usually restricted)
        # However, we can try to see if there's a view or a way to list users
        # Often, people use a 'profiles' table that syncs with auth.users
        print("Checking for common user tables...")
        # Since 'profiles' and 'users' failed in public schema, 
        # let's try to query the bots table to see what user_ids exist.
        res = supabase.table("bots").select("user_id").execute()
        user_ids = set(row['user_id'] for row in res.data)
        print(f"Unique user_ids found in 'bots' table: {len(user_ids)}")
        for uid in list(user_ids)[:5]:
             print(f" - {uid}")

    except Exception as e:
        print(f"Error: {e}")

inspect_auth()
