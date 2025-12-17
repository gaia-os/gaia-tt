import os
import time
from pathlib import Path

# Climb up the paths until we find the pyproject toml
PROJECT_ROOT = Path(__file__).resolve().parent
while not (PROJECT_ROOT / 'pyproject.toml').exists():
    if PROJECT_ROOT.parent == PROJECT_ROOT:  # We've reached the root of the filesystem
        raise FileNotFoundError("pyproject.toml not found in any parent directories.")
    PROJECT_ROOT = PROJECT_ROOT.parent

TESTS_OUT = os.path.join(PROJECT_ROOT, "tests", "tmp")

# Log filename will be based on the current time
_default_name = f"{time.strftime('%Y-%m-%d-%H%M%S')}.log"
# Note the path may be modified in gtt.logger.py so this is not a reliably imported variable
LOG_PATH = os.path.join(PROJECT_ROOT, "logs", _default_name)

# Can help redirect operations depending on user/system context
SYSTEM_USER = os.getenv("USER", "unknown")

# --- Neo4j / neomodel configuration ---
# Defaults are aligned with the suggested local Docker command in the README.
NEO4J_SCHEME = os.getenv("NEO4J_SCHEME", "bolt")
NEO4J_HOST = os.getenv("NEO4J_HOST", "localhost")
NEO4J_PORT = int(os.getenv("NEO4J_PORT", "7687"))
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "test")

# If NEO4J_URL is set, use it directly; otherwise build it from parts.
_env_url = os.getenv("NEO4J_URL")
if _env_url:
    NEO4J_URL = _env_url
else:
    # neomodel expects form: bolt://user:password@host:port
    NEO4J_URL = f"{NEO4J_SCHEME}://{NEO4J_USER}:{NEO4J_PASSWORD}@{NEO4J_HOST}:{NEO4J_PORT}"
