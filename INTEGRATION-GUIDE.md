# Python-TypeScript Integration Guide

## 🎯 Architecture Overview

The app now integrates your **Python NuclearScheduler** with the Next.js frontend:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│   Next.js    │─────▶│   Python    │
│  Frontend   │ HTTP │   API Route  │ exec │     CLI     │
│             │◀─────│  /api/simulate│◀─────│  scheduler  │
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                           ▼
                      [tmp/*.json]
```

### Data Flow:
1. Frontend sends graph data + simulation params
2. API route writes graph to temporary JSON file
3. API spawns `uv run nuclear-scheduler` CLI command
4. Python processes simulation, writes results to JSON
5. API reads results and returns to frontend
6. Frontend displays heatmaps and status timelines

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.13 (managed by uv)
- uv package manager

### Installation

```bash
# Install Node dependencies
npm install

# Install Python dependencies with uv
uv sync --all-extras
```

### Testing the Python CLI Standalone

```bash
# Export graph data from TypeScript to JSON
npm run export-graph

# Run Python scheduler directly
uv run nuclear-scheduler --graph graph.json --years 20

# Output will be in: scripts/data/simulations/latest/results.json
```

### Running the Full App

```bash
# Start Next.js dev server
npm run dev

# Visit http://localhost:3000
# Navigate to the "Simulations" tab
# Click "Run Simulation"
```

## 📁 Key Files

### Python Backend
- `src/techtree/scheduler.py` - Main NuclearScheduler implementation
- `src/techtree/cli.py` - CLI entry point
- `pyproject.toml` - Python package config with `nuclear-scheduler` script

### Frontend Integration
- `src/app/api/simulate/route.ts` - Next.js API route that calls Python
- `src/components/Simulations.tsx` - React component (updated to use API)
- `scripts/export-graph.ts` - Utility to export graph data for testing

### Configuration
- Uses `uv run` to execute CLI in correct Python environment
- Temporary files stored in `/tmp` directory
- 60-second timeout for simulations

## 🔧 Troubleshooting

### "command not found: nuclear-scheduler"
Use `uv run nuclear-scheduler` instead of bare `nuclear-scheduler`. The uv-managed environment handles all dependencies.

### API returns 500 error
Check server logs in terminal running `npm run dev`. Common issues:
- uv not installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Python dependencies not synced: `uv sync --all-extras`

### Graph data mismatch
Ensure DATA.ts exports match Python's expected schema:
```typescript
{
  nodes: [{ id, data: { label, nodeLabel, trl_current, ... }}],
  edges: [{ source, target }]
}
```

## 🎨 Customization

### Change simulation parameters
Edit `src/components/Simulations.tsx`:
```typescript
const [yearsToSimulate, setYearsToSimulate] = useState(20);
```

### Modify Python model assumptions
Edit constants in `src/techtree/scheduler.py`:
```python
DISCOUNT_RATE = 0.05
YEARS_OF_OPERATION = 60
AVG_PLANT_CAPACITY_MW = 1000
```

### Add PyMC probabilistic models
The Python scheduler is ready for PyMC integration. Modify `_calculate_pathway_mwh()` to use probabilistic distributions instead of deterministic calculations.

## 📊 Output Format

Both TypeScript and Python schedulers return the same format:

```json
{
  "impactData": {
    "Technology Label": {
      "2025": 0.05,
      "2026": 0.12,
      ...
    }
  },
  "statusData": {
    "Technology Label": {
      "2025": "Active",
      "2026": "Completed",
      ...
    }
  }
}
```

- **impactData**: TWh impact per technology per year
- **statusData**: "Pending" | "Active" | "Completed"

## 🏗️ Development Workflow

### Iterating on Python models
```bash
# 1. Export latest graph data
npm run export-graph

# 2. Test Python changes quickly
uv run nuclear-scheduler --graph graph.json --years 5

# 3. Verify output format
cat scripts/data/simulations/latest/results.json | jq
```

### Deploying
```bash
# Build production bundle
npm run build

# Ensure Python environment is available on server
uv sync --no-dev

# Start production server
npm start
```

**Note**: Production deployments need:
- uv installed on server
- Python 3.13 available
- Write permissions for /tmp directory

## 💡 Next Steps

1. **Add caching**: Cache simulation results to avoid recomputation
2. **Background jobs**: Use job queue for long-running simulations
3. **Streaming**: Stream progress updates from Python to frontend
4. **Remove TS scheduler**: Once confident, delete `src/lib/nuclearScheduler.ts`

## 🤝 Why This Architecture?

✅ **No database needed** - File-based IPC is simple and works
✅ **Best of both worlds** - Python's scientific computing + TypeScript UI
✅ **Easy iteration** - Develop complex models in Python ecosystem
✅ **Type safety** - Frontend remains fully typed
✅ **CLI flexibility** - Can run simulations standalone for automation

Your Python module is the source of truth. The TypeScript version can eventually be deprecated.
