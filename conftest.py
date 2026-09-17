import os
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

os.environ["TESTING"] = "true"
os.environ["JWT_SECRET"] = os.getenv("JWT_SECRET", "test-secret-key-only-for-automated-pytest-execution-94821")
os.environ["DEMO_MODE"] = os.getenv("DEMO_MODE", "true")
os.environ["ENABLE_INNOVATION_LAB"] = "true"
os.environ["GEMINI_API_KEY"] = os.getenv("TEST_GEMINI_API_KEY", "")
