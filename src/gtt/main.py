from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gtt.graph.api import router as graph_router
from gtt.sim.api import router as sim_router
from gtt.db import ensure_connection_async

@asynccontextmanager
async def lifespan(fapp: FastAPI):
    """
    Both the startup and the shutdown events for FastAPI are handled here.
    They are separated by the yield statement.

    TODO -- The FastAPI docs mention this as a useful point for loading
    language models or other heavy resources.
    https://fastapi.tiangolo.com/advanced/events/#use-case
    """
    # Startup: Verify Neo4j connectivity
    await ensure_connection_async()
    yield
    # Shutdown: Add any cleanup code here if needed

app = FastAPI(title="GAIA Tech Tree", lifespan=lifespan)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(graph_router, prefix="/api")
app.include_router(sim_router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "online", "message": "GAIA Tech Tree API is active"}
