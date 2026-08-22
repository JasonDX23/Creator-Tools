import sys
import os

# Explicitly add the project root directory (one level above /api) to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from backend.app.main import app
except Exception as e:
    print(f"Failed to import app: {e}")
    raise e