# Investment Tech Tree

An interactive visualization platform for exploring fusion energy technology development pathways and investment opportunities. This web application provides a comprehensive view of nuclear reactor concepts (both fusion and fission), enabling technologies, and key milestones in the nuclear energy landscape.

## Project Purpose

The Investment Tech Tree serves as a decision-support tool for investors, researchers, and policymakers in the nuclear energy sector. It visualizes the complex relationships between different technologies, their current Technology Readiness Levels (TRL), and the critical milestones needed to advance toward commercial nuclear power.

The platform features a full CRUD interface for editing the technology tree, AI-powered document analysis for suggesting improvements, and integration with MongoDB for persistent data storage.

## Key Features

### Interactive Technology Graph

- **Visual Technology Mapping**: Interactive graph showing fusion reactor concepts, enabling technologies, and milestones
- **Technology Readiness Levels**: Current and projected TRL tracking for each technology node
- **Relationship Visualization**: Clear depiction of dependencies and connections between technologies
- **Node Highlighting**: Interactive selection with connected element highlighting

### AI-Powered Chat Interface

- **Contextual Assistance**: AI chat powered by Google Gemini with full knowledge of the tech tree
- **Technology Queries**: Ask questions about specific technologies, milestones, or investment opportunities
- **Rate Limiting**: Built-in request limiting to manage API usage
- **Persistent History**: Chat history saved locally for continuity
- **PDF Document Upload**: Upload research papers and technical documents for AI analysis and making suggestions for editing the TT

### Administrative Features

- **Edit Mode**: Password-protected interface for modifying the technology tree
- **CRUD Operations**: Create, read, update, and delete nodes and edges
- **Real-time Updates**: Changes are immediately saved to MongoDB
- **Graph Editing**: Add or remove connections between technologies
- **TRL Management**: Update technology readiness levels based on new evidence

### InFact Analysis Integration

- **TRL Verification**: Automated analysis of technology readiness levels
- **Uncertainty Metrics**: Probability and uncertainty measurements for TRL assessments
- **Detailed Reports**: Full analysis reports with evidence and interpretation
- **Interactive Visualization**: View complete analysis in embedded HTML reports


## Technology Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives

### Visualization

- **React Flow**: Interactive node-based graph visualization
- **ELK.js**: Automatic graph layout and positioning
- **Custom Node Types**: Specialized node components for different technology types

### AI Integration

- **Google Gemini API**: Advanced language model for contextual assistance
- **DOMPurify**: XSS protection for AI-generated content
- **Rate Limiting**: Client-side request management
- **PDF Processing**: Support for uploading and analyzing PDF documents

### Development Tools

- **ESLint & Prettier**: Code quality and formatting
- **TypeScript**: Static type checking
- **PostCSS & Autoprefixer**: CSS processing

## Architecture Overview

### Data Structure

The application uses MongoDB Atlas for persistent data storage with three main node types:

1. **Reactor Concepts**: Core fusion reactor designs (Tokamak, Stellarator, FRC, ICF)
2. **Milestones**: Critical achievements and demonstrations
3. **Enabling Technologies**: Supporting technologies and components

Each node includes:

- Technology Readiness Level (TRL) tracking
- Detailed descriptions and context
- Category and subtype classification
- Projected development timelines
- References and citations
- InFact analysis results (when available)

### Component Architecture

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes for data operations
│   │   ├── tech-tree/  # Fetch all nodes and edges
│   │   ├── nodes/      # CRUD operations for nodes
│   │   └── edges/      # CRUD operations for edges
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── TechTree.tsx    # Main graph visualization
│   ├── Chat.tsx        # AI chat interface
│   ├── NodeDetails.tsx # Node information display
│   ├── TabPanel.tsx    # Tabbed interface for chat/details/simulations
│   ├── EditInterface.tsx        # Edit mode wrapper
│   ├── EditTechTreePanel.tsx    # CRUD interface for editing
│   ├── AiAssistantPanel.tsx     # Specialized AI for document analysis and edit suggestions
│   ├── GroupSelector.tsx        # Graph grouping and filtering
│   ├── CustomNode.tsx           # Custom node rendering
│   ├── NodeActions.tsx          # Node action buttons
│   ├── Legend.tsx               # Graph legend
│   ├── MobileWarning.tsx        # Mobile device warning
│   └── LoadingSpinner.tsx       # Loading state
├── hooks/              # Custom React hooks
│   └── useTechTree.ts  # Hook for fetching tech tree data
├── lib/                # Utility libraries
│   ├── types.ts        # TypeScript type definitions
│   ├── elkjs.ts        # Graph layout engine
│   ├── geminiClient.ts # AI client integration
│   ├── mongodb.ts      # MongoDB connection
│   └── utils.ts        # Utility functions
```

### State Management

- **React Hooks**: Local component state management
- **Local Storage**: Persistent chat history and user preferences
- **Context API**: Shared state for graph interactions
- **MongoDB**: Server-side persistent storage for all tech tree data

## Getting Started

### Prerequisites

- Node.js 18+ (<https://nodejs.org/en/download>)
- npm or yarn package manager
- MongoDB Atlas Account (https://www.mongodb.com/cloud/atlas)

### Database Setup

- Sign up at https://www.mongodb.com/cloud/atlas
- Create a new free cluster
- Note your cluster connection details
- Run following script to set-up/ reset the DB: https://colab.research.google.com/drive/1D29KXaDIdBglvhCb5NszKSRRKOCMOnTr?usp=sharing

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd investment-tech-tree
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_ENVIRONMENT=development
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_tech_tree_db_connection_string
   NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password_here
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   Open <http://localhost:3000/investment-tech-tree> in your browser

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ENVIRONMENT` | Environment mode (development/production) | Yes |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key for chat functionality | Yes |
| `MONGODB_URI` | Connection string for DB | Yes |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin PWD for TT Edits | Yes |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project uses automated code quality tools:

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **lint-staged**: Pre-commit hooks for code quality

### Data Management

All technology tree data is stored in MongoDB Atlas. To modify the tech tree:

**Using the Edit Interface:**
   - Click "Edit Tree" in the main interface
   - Enter the admin password (set in `NEXT_PUBLIC_ADMIN_PASSWORD`)
   - Use the edit interface to:
     - Add new nodes with required connections
     - Edit existing node properties
     - Delete nodes (removes connected edges automatically)
     - Add or remove edges between nodes
   - Changes are saved immediately to MongoDB

**Using the AI Assistant:**
   - Upload research papers or technical documents
   - AI analyzes content and suggests additions/modifications
   - Review suggestions and manually apply via Edit Interface

## Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Static Export

The application can be exported as static files:

```bash
npm run build
# Static files will be in the 'out' directory
```

## Mobile support

The application is optimized for desktop and tablet devices. Mobile phone users will see a warning dialog recommending desktop usage for the best experience. However, the application is functional on mobile with responsive adaptations:

- Toggle buttons for showing/hiding legend and options
- Collapsible panels and controls
- Touch-friendly interface elements
- Simplified navigation


### Deploying to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `MONGODB_URI`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
   - `NEXT_PUBLIC_ENVIRONMENT=production`
4. Deploy

The application will be available at your Vercel domain with the `/investment-tech-tree` base path.


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

---

## Neo4j (local) with neomodel

This project can connect to a local Neo4j instance via `neomodel` for graph-backed features.

### Start Neo4j via Docker

We'll use `neo4j:2025.10.1-community-bullseye`

Run the container using `docker-compose`

```bash
docker-compose up [-d]
```

- Browser: http://localhost:7474 (user: `neo4j`, pass: `gaia-neo4j-dev`)
- Bolt: bolt://localhost:7687

### Python configuration (neomodel)

The connection URL is configured via environment variables or sensible defaults. See `src/gtt/settings.py`.

Environment variables supported (all optional for local default):

- `NEO4J_SCHEME` (default: `bolt`)
- `NEO4J_HOST` (default: `localhost`)
- `NEO4J_PORT` (default: `7687`)
- `NEO4J_USER` (default: `neo4j`)
- `NEO4J_PASSWORD` (default: `gaia-neo4j-dev`)
- `NEO4J_URL` (overrides all; format: `bolt://user:password@host:port`)

On import, `src/gtt/db.py` sets `neomodel.config.DATABASE_URL` using the assembled URL.

> Note these won't be used by the docker-compose instance.

### Quick connectivity check

With Python environment active (e.g., `uv run` or `hatch shell`), run:

```bash
hatch run db:check
```

Expected output:

```
Neo4j connection OK
```

If you see authentication or connection errors, verify Docker is running and the credentials/port match the container settings.
