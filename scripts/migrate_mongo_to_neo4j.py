import os
import asyncio
from pymongo import MongoClient
from gtt.graph.obj import TTNode
from neomodel import config, db
from gtt.settings import NEO4J_URL

# Set Neo4j URL for neomodel
config.DATABASE_URL = NEO4J_URL

async def migrate():
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("MONGODB_URI environment variable not set.")
        return

    print(f"Connecting to MongoDB...")
    mongo_client = MongoClient(mongo_uri)
    mongo_db = mongo_client.get_database("tech_tree_db")
    
    # 1. Migrate Nodes
    print("Migrating nodes...")
    nodes_collection = mongo_db.get_collection("nodes")
    mongo_nodes = list(nodes_collection.find({}))
    
    for m_node in mongo_nodes:
        node_id = m_node.get("id")
        if not node_id:
            continue
            
        print(f"  Processing node: {node_id}")
        
        # Check if node already exists in Neo4j
        node = await TTNode.nodes.get_or_none(node_id=node_id)
        if not node:
            node = TTNode(
                node_id=node_id,
                label=m_node.get("label"),
                node_type=m_node.get("type"),
                category=m_node.get("category"),
                subtype=m_node.get("subtype"),
                trl_current=m_node.get("trl_current"),
                trl_projected_5_10_years=m_node.get("trl_projected_5_10_years"),
                description=m_node.get("description"),
                detailed_description=m_node.get("detailedDescription"),
                references=m_node.get("references", [])
            )
            await node.save()
            print(f"    Created node: {node_id}")
        else:
            print(f"    Node {node_id} already exists, skipping creation.")

    # 2. Migrate Edges
    print("Migrating edges...")
    edges_collection = mongo_db.get_collection("edges")
    mongo_edges = list(edges_collection.find({}))
    
    for m_edge in mongo_edges:
        source_id = m_edge.get("source")
        target_id = m_edge.get("target")
        
        if not source_id or not target_id:
            continue
            
        print(f"  Processing edge: {source_id} -> {target_id}")
        
        source_node = await TTNode.nodes.get_or_none(node_id=source_id)
        target_node = await TTNode.nodes.get_or_none(node_id=target_id)
        
        if source_node and target_node:
            if not await source_node.depends_on.is_connected(target_node):
                await source_node.depends_on.connect(target_node)
                print(f"    Connected {source_id} -> {target_id}")
            else:
                print(f"    Edge {source_id} -> {target_id} already exists.")
        else:
            print(f"    Missing source or target node for edge: {source_id} -> {target_id}")

    print("Migration completed.")

if __name__ == "__main__":
    asyncio.run(migrate())
