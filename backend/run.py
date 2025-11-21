# run.py
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print(f"CWD: {os.getcwd()}")
print(f"Script: {__file__}")
print(f"Python path: {sys.path}")

from app import create_app

# We create the app instance by calling the factory
app = create_app()

if __name__ == "__main__":
    # Get config from the app's config object
    debug_mode = app.config.get('FLASK_DEBUG', False)
    port = int(app.config.get('FLASK_PORT', 5001))
    
    app.logger.info(f"--- Starting Warmth Server at http://127.0.0.1:{port} ---")
    app.logger.info(f"Debug mode: {debug_mode}")
    
    app.run(debug=debug_mode, port=port, host='0.0.0.0')