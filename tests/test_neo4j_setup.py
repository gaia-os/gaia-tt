"""
Tests to verify Neo4j database setup and connectivity.
"""
from gtt import db as gtt_db
from gtt.settings import NEO4J_URL


def test_neo4j_connection():
    """
    Test that the application can connect to the running Neo4j instance.
    """
    # This relies on gtt.db module initialization to set the neomodel config
    print(f"Connecting to Neo4j at: {NEO4J_URL}")
    assert gtt_db.ensure_connection() is True


def test_neo4j_read_write():
    """
    Test a simple write and read to ensure the database is writable.
    """
    # Create a unique verifying string
    test_key = "test_setup_key"
    test_val = "working"

    # Clean up potentially leftover data from previous failed runs
    query_cleanup = f"MATCH (n:TestNode {{key: '{test_key}'}}) DETACH DELETE n"
    gtt_db.db.cypher_query(query_cleanup)

    # Create test node
    query_create = f"CREATE (n:TestNode {{key: '{test_key}', val: '{test_val}'}}) RETURN n"
    gtt_db.db.cypher_query(query_create)

    # Read back
    query_read = f"MATCH (n:TestNode {{key: '{test_key}'}}) RETURN n.val"
    results, meta = gtt_db.db.cypher_query(query_read)

    assert len(results) > 0
    assert results[0][0] == test_val

    # Cleanup
    gtt_db.db.cypher_query(query_cleanup)
