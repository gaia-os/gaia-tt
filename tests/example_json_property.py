import asyncio

from gtt.db import ensure_connection, ensure_connection_async
from gtt.graph.obj import TTNode

async def main():
    print("Connecting to Neo4j...")
    try:
        ensure_connection()
        print("Connected.")
    except Exception as e:
        print(f"Failed to connect to Neo4j: {e}")
        return

    # 1. Create a node with JSON properties
    # 'groups' is a JSONProperty(default=[])
    # 'infact_analysis' is a JSONProperty()

    print("\nCreating TTNode with JSON properties...")
    node = TTNode(
        uid="example-node-001",
        code="example_node",
        label="Example Node",
        groups=[
            {"id": "group1", "label": "Renewable Energy"},
            {"id": "group2", "label": "Solar"}
        ],
        infact_analysis={
            "score": 0.95,
            "keywords": ["photovoltaic", "efficiency"],
            "metadata": {
                "source": "internal",
                "verified": True
            }
        }
    )

    # Save the node asynchronously
    await node.save()
    print(f"Node saved: {node.uid}")

    # 2. Retrieve the node
    print("\nRetrieving node...")
    retrieved_node = await TTNode.nodes.get(uid="example-node-001")

    # 3. Access JSON properties
    # They are automatically deserialized into Python objects (lists/dicts)
    print(f"Groups (type: {type(retrieved_node.groups)}):")
    print(retrieved_node.groups)

    print(f"Infact Analysis (type: {type(retrieved_node.infact_analysis)}):")
    print(retrieved_node.infact_analysis)

    # 4. Modify JSON property
    print("\nModifying JSON property...")
    retrieved_node.groups.append({"id": "group3", "label": "New Group"})
    retrieved_node.infact_analysis["score"] = 0.99

    await retrieved_node.save()
    print("Node updated.")

    # 5. Verify update
    updated_node = await TTNode.nodes.get(uid="example-node-001")
    print(f"Updated Groups count: {len(updated_node.groups)}")
    print(f"Updated Score: {updated_node.infact_analysis['score']}")

    # Clean up
    print("\nDeleting node...")
    await updated_node.delete()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(main())

