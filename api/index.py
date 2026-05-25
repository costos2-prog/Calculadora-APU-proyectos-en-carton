import sys
import os

# Add backend/ to Python path so all backend imports resolve correctly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app  # noqa: F401 – Vercel needs this name 'app' exported
