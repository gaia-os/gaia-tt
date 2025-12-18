from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from gtt.graph.models import TechNode, NodeSchema, EdgeSchema
from neomodel import db

router = APIRouter(tags=["graph"])


class NodeUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    subtype: Optional[str] = None
    trl_current: Optional[str] = None
    trl_projected_5_10_years: Optional[str] = None
    description: Optional[str] = None
    detailedDescription: Optional[str] = None
    references: Optional[List[str]] = None
    infact_analysis: Optional[dict] = None
    infact_analysis_html_content: Optional[str] = None
    infact_status: Optional[str] = None

#====  GETTING  ====#

@router.get("/tech-tree")
async def get_tech_tree():
    """Returns the full graph in a format compatible with the React frontend."""
    nodes = await TechNode.nodes.all()
    
    # Efficiently fetch all edges using Cypher
    results, _ = await db.adb.cypher_query(
        "MATCH (n:TechNode)-[:DEPENDS_ON]->(m:TechNode) RETURN n.node_id, m.node_id"
    )
    
    edges = [
        {"id": f"e-{s}-{t}", "source": s, "target": t} 
        for s, t in results
    ]
    
    return {
        "nodes": [
            {
                "id": n.node_id,
                "data": {
                    "label": n.label,
                    "nodeLabel": n.node_type,
                    "description": n.description,
                    "detailedDescription": n.detailed_description,
                    "category": n.category,
                    "subtype": n.subtype,
                    "trl_current": n.trl_current,
                    "trl_projected_5_10_years": n.trl_projected_5_10_years,
                    "references": n.references,
                    "infact_analysis": n.infact_analysis,
                    "infact_analysis_html_content": n.infact_analysis_html_content,
                    "infact_status": n.infact_status
                }
            } for n in nodes
        ],
        "edges": edges
    }

@router.get("/nodes/{node_id}", response_model=NodeSchema)
async def get_node(node_id: str):
    node = await TechNode.nodes.get_or_none(node_id=node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    return NodeSchema(
        id=node.node_id,
        label=node.label,
        type=node.node_type,
        category=node.category,
        subtype=node.subtype,
        trl_current=node.trl_current,
        trl_projected_5_10_years=node.trl_projected_5_10_years,
        description=node.description,
        detailedDescription=node.detailed_description,
        references=node.references,
        infact_analysis=node.infact_analysis,
        infact_analysis_html_content=node.infact_analysis_html_content,
        infact_status=node.infact_status
    )

#====  POSTING  ====#

@router.post("/nodes", response_model=NodeSchema, status_code=201)
async def create_node(node_data: NodeSchema):
    if await TechNode.nodes.get_or_none(node_id=node_data.id):
        raise HTTPException(status_code=409, detail="Node already exists")
    
    node = await TechNode(
        node_id=node_data.id,
        label=node_data.label,
        node_type=node_data.type,
        category=node_data.category,
        subtype=node_data.subtype,
        trl_current=node_data.trl_current,
        trl_projected_5_10_years=node_data.trl_projected_5_10_years,
        description=node_data.description,
        detailed_description=node_data.detailedDescription,
        references=node_data.references,
        infact_analysis=node_data.infact_analysis,
        infact_analysis_html_content=node_data.infact_analysis_html_content,
        infact_status=node_data.infact_status
    ).save()

    return NodeSchema(
        id=node.node_id,
        label=node.label,
        type=node.node_type,
        category=node.category,
        subtype=node.subtype,
        trl_current=node.trl_current,
        trl_projected_5_10_years=node.trl_projected_5_10_years,
        description=node.description,
        detailedDescription=node.detailed_description,
        references=node.references,
        infact_analysis=node.infact_analysis,
        infact_analysis_html_content=node.infact_analysis_html_content,
        infact_status=node.infact_status,
    )

@router.post("/edges", status_code=201)
async def create_edge(edge_data: EdgeSchema):
    source = await TechNode.nodes.get_or_none(node_id=edge_data.source)
    target = await TechNode.nodes.get_or_none(node_id=edge_data.target)

    if not source or not target:
        raise HTTPException(status_code=404, detail="Nodes not found")

    await source.depends_on.connect(target)

#====  PUTTING  ====#

@router.put("/nodes/{node_id}")
async def replace_node(node_id: str, node_data: NodeSchema):
    node = await TechNode.nodes.get_or_none(node_id=node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    node.label = node_data.label
    node.node_type = node_data.type
    node.category = node_data.category
    node.subtype = node_data.subtype
    node.trl_current = node_data.trl_current
    node.trl_projected_5_10_years = node_data.trl_projected_5_10_years
    node.description = node_data.description
    node.detailed_description = node_data.detailedDescription
    node.references = node_data.references
    node.infact_analysis = node_data.infact_analysis
    node.infact_analysis_html_content = node_data.infact_analysis_html_content
    node.infact_status = node_data.infact_status
    
    await node.save()

    return NodeSchema(
        id=node.node_id,
        label=node.label,
        type=node.node_type,
        category=node.category,
        subtype=node.subtype,
        trl_current=node.trl_current,
        trl_projected_5_10_years=node.trl_projected_5_10_years,
        description=node.description,
        detailedDescription=node.detailed_description,
        references=node.references,
        infact_analysis=node.infact_analysis,
        infact_analysis_html_content=node.infact_analysis_html_content,
        infact_status=node.infact_status,
    )

#====  PATCHING  ====#

@router.patch("/nodes/{node_id}", response_model=NodeSchema)
async def update_node(node_id: str, node_data: NodeUpdate):
    node = await TechNode.nodes.get_or_none(node_id=node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    for field, value in node_data.model_dump(exclude_unset=True).items():
        if field == "type":
            setattr(node, "node_type", value)
        elif field == "detailedDescription":
            setattr(node, "detailed_description", value)
        else:
            setattr(node, field, value)

    await node.save()

    return NodeSchema(
        id=node.node_id,
        label=node.label,
        type=node.node_type,
        category=node.category,
        subtype=node.subtype,
        trl_current=node.trl_current,
        trl_projected_5_10_years=node.trl_projected_5_10_years,
        description=node.description,
        detailedDescription=node.detailed_description,
        references=node.references,
        infact_analysis=node.infact_analysis,
        infact_analysis_html_content=node.infact_analysis_html_content,
        infact_status=node.infact_status,
    )


#====  DELETING  ====#
# We return no response on success, and set the status code to 204 No Content.

@router.delete("/nodes/{node_id}", status_code=204)
async def delete_node(node_id: str):
    node = await TechNode.nodes.get_or_none(node_id=node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    await node.delete()

@router.delete("/edges/{edge_id}", status_code=204)
async def delete_edge(edge_id: str):
    # Expecting edge_id in format "source-target"
    parts = edge_id.split("-")
    if len(parts) < 2:
        # Try to handle cases where IDs might contain hyphens? 
        # But the frontend seems to use `${source}-${target}`
        raise HTTPException(status_code=400, detail="Invalid edge ID format. Expected 'source-target'")
    
    source_id = parts[0]
    target_id = "-".join(parts[1:]) # Handle case where target_id might have hyphens
    
    source = await TechNode.nodes.get_or_none(node_id=source_id)
    target = await TechNode.nodes.get_or_none(node_id=target_id)
    
    if not source or not target:
        # Maybe source_id also had hyphens? This is tricky with simple hyphen separation.
        # Let's try to find if there's an edge between them.
        # Better: iterate through possible split points? 
        # Or just use what the frontend sends.
        raise HTTPException(status_code=404, detail="Nodes not found")

    await source.depends_on.disconnect(target)
