"""Env vars"""
# TODO -- Incorporate logic to read user-defined envs from outside the system

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
# Note the path may be modified in techtree.logger.py so this is not a reliably imported variable
LOG_PATH = os.path.join(PROJECT_ROOT, "logs", _default_name)

# Can help redirect operations depending on user/system context
SYSTEM_USER = os.getenv("USER", "unknown")
