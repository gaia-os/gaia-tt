from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from gtt.sim.runner.runner import simulate_chain
from gtt.graph.obj import TTNode

router = APIRouter(prefix="/sim", tags=["sim"])

class SimulationRequest(BaseModel):
    node_ids: List[str]
    years: int = 10
    draws: int = 100

@router.post("/run")
async def run_simulation(req: SimulationRequest):
    """Runs a Monte Carlo simulation for a specific chain of nodes."""
    chain = []
    for nid in req.node_ids:
        node = await TTNode.nodes.get_or_none(node_id=nid)
        if not node:
            raise HTTPException(status_code=404, detail=f"Node {nid} not found")
        chain.append(node.to_dict())
    
    if not chain:
        raise HTTPException(status_code=400, detail="Valid chain required")
        
    result = simulate_chain(chain, years_to_simulate=req.years, draws=req.draws)

    return {"simulation": result}
