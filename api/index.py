import sys
import os

# Add the project root directory explicitly to Python's path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from backend.app.main import app
except Exception as e:
    # Print error details to Vercel logs if loading fails
    print(f"Error loading main FastAPI app: {e}")
    raise e