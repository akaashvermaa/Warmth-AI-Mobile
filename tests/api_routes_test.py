import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app

def test_routes():
    app = create_app()
    with app.app_context():
        rules = [str(p) for p in app.url_map.iter_rules()]
        
        required_routes = [
            '/mood_logs',
            '/recap',
            '/journal_entries/',
            '/memories/'
        ]
        
        print("Checking routes...")
        all_present = True
        for route in required_routes:
            found = any(route in r for r in rules)
            if found:
                print(f"✅ Route found: {route}")
            else:
                print(f"❌ Route MISSING: {route}")
                all_present = False
                
        if all_present:
            print("\nSUCCESS: All required routes are present.")
        else:
            print("\nFAILURE: Some routes are missing.")
            
if __name__ == "__main__":
    test_routes()
