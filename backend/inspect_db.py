import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def inspect():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase = create_client(url, key)

    print("--- Database Inspection ---")
    
    # Check bots table
    try:
        bots = supabase.table("bots").select("id", count="exact").limit(1).execute()
        print(f"Bots table exists. Total count (estimate or sample): {bots.count}")
    except Exception as e:
        print(f"Error accessing bots table: {e}")

    # Check for profiles or users table (common patterns)
    tables_to_check = ["profiles", "users", "user_profiles"]
    for table in tables_to_check:
        try:
            res = supabase.table(table).select("id", count="exact").limit(1).execute()
            print(f"Table '{table}' exists. Total count: {res.count}")
        except Exception:
            print(f"Table '{table}' does not seem to exist or is not accessible.")

inspect()
