import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
DEFAULT_USER_ID = os.getenv('DEFAULT_USER_ID', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

print(f"--- Creating Default User in Supabase ---")
print(f"URL: {SUPABASE_URL}")
print(f"User ID: {DEFAULT_USER_ID}")

try:
    # Initialize Supabase client with Service Role Key
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Check if user already exists
    try:
        user = supabase.auth.admin.get_user_by_id(DEFAULT_USER_ID)
        if user:
            print(f"✅ User {DEFAULT_USER_ID} already exists!")
            sys.exit(0)
    except Exception:
        print("User does not exist, creating...")

    # Create the user
    attributes = {
        "email": "dev@warmth.local",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Development User"
        }
    }
    
    # Note: supabase-py admin.create_user might have different signature depending on version
    # We'll try the standard way
    user = supabase.auth.admin.create_user({
        "email": "dev@warmth.local",
        "password": "dev_password_123",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Development User"
        }
    })
    
    # We can't force the ID on creation easily with the python client usually, 
    # but let's see if we can update it or if we just need ANY valid user.
    # Actually, if we can't force the ID, we should UPDATE our config to use the NEW ID.
    
    if hasattr(user, 'user') and user.user:
        new_id = user.user.id
        print(f"✅ Created new user with ID: {new_id}")
        
        if new_id != DEFAULT_USER_ID:
            print(f"⚠️ WARNING: Created user ID {new_id} does not match DEFAULT_USER_ID {DEFAULT_USER_ID}")
            print(f"💡 ACTION REQUIRED: Update DEFAULT_USER_ID in your .env file to: {new_id}")
            
            # Let's try to update the .env file automatically if possible, or just warn the user
            # For now, we'll just print it clearly.
    else:
        print("❌ Failed to create user (unknown response format)")

except Exception as e:
    print(f"❌ Error creating user: {e}")
    # Fallback: Try to just get ANY user and tell the user to use that ID
    try:
        users = supabase.auth.admin.list_users()
        if users:
            first_user_id = users[0].id
            print(f"\n💡 Found existing user ID: {first_user_id}")
            print(f"Please update DEFAULT_USER_ID in .env to: {first_user_id}")
    except:
        pass
