import sys
import os
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

load_dotenv()

print("--- Starting Static Verification ---")

try:
    print("1. Attempting to import create_app...")
    from app import create_app
    print("✅ Successfully imported create_app")

    print("2. Attempting to initialize app factory...")
    app = create_app()
    print("✅ Successfully initialized app factory")
    
    print("3. Checking key components...")
    if hasattr(app, 'supabase'):
        print("✅ App has supabase client attached")
    else:
        print("❌ App missing supabase client")
        
    if hasattr(app, 'chat_service'):
        print("✅ App has chat_service attached")
    else:
        print("❌ App missing chat_service")

    print("\n🎉 VERIFICATION SUCCESSFUL: No NameErrors or ImportErrors found!")

except ImportError as e:
    print(f"\n❌ ImportError: {e}")
except NameError as e:
    print(f"\n❌ NameError: {e}")
except Exception as e:
    print(f"\n❌ Unexpected Error: {e}")
    import traceback
    traceback.print_exc()
