"""
Neo4j / neomodel initialization.

Importing this module sets the neomodel DATABASE_URL from `gtt.settings`.
Provides `ensure_connection()` helper to verify connectivity.
"""
from neomodel import db, get_config

from gtt.settings import NEO4J_URL

# Configure neomodel once on import.
config = get_config()
config.database_url = NEO4J_URL


def ensure_connection() -> bool:
    """Attempt a trivial cypher query to verify connectivity.

    Returns True when the database responds; raises on connection/auth errors.
    """
    db.cypher_query("RETURN 1 AS ok")
    return True


async def ensure_connection_async() -> bool:
    """Asynchronous connection check for FastAPI startup."""
    await db.adb.cypher_query("RETURN 1 AS ok")
    return True
