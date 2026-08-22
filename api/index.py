import sys
import os

# Add root and backend to path so imports inside backend/app work correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import the FastAPI instance from your backend
from backend.app.main import app