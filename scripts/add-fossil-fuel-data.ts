/**
 * scripts/add-fossilfuel-data.ts
 *
 * Standalone seed script that reads the fossil fuels tech tree from a local
 * JSON file, normalizes the data, and upserts it into MongoDB.
 *
 * Usage:
 *   npx ts-node scripts/add-fossilfuel-data.ts
 *   -- or, if you have a scripts entry in package.json --
 *   npm run seed:fossilfuels
 *
 * Environment variables:
 *   MONGODB_URI  – MongoDB connection string (required)
 */

import * as fs from "fs";
import * as path from "path";
import { MongoClient } from "mongodb";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const JSON_FILE_PATH = path.resolve(__dirname, "../data/fossil_fuel_tt_v2.json");
const DB_NAME = "fossil_fuels_tt_db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawNode {
  id: string;
  label: string;
  type: string;
  category: string;
  trl_current?: string | number | null;
  trl_projected_5_10_years?: string | number | null;
  description?: string;
  references?: string[];
  [key: string]: unknown;
}

interface RawEdgeSingleTarget {
  source: string;
  target: string;
  [key: string]: unknown;
}

interface RawEdgeMultiTarget {
  source: string;
  targets: string[];
  [key: string]: unknown;
}

type RawEdge = RawEdgeSingleTarget | RawEdgeMultiTarget;

interface NormalizedEdge {
  id: string;
  source: string;
  target: string;
}

interface TechTreeGraph {
  nodes: RawNode[];
  edges: RawEdge[];
}

interface TechTreeData {
  graph: TechTreeGraph;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the first integer found in `value` and returns it as a string.
 * Falls back to `defaultValue` when no digit is found or the input is nullish.
 *
 * Examples:
 *   "5-6"              → "5"
 *   "7-9 (LWRs); 4-6" → "7"
 *   null / ""          → defaultValue  (default: "1")
 */
function toSingleTrl(
  value: string | number | null | undefined,
  defaultValue = "1"
): string {
  if (value == null) return defaultValue;
  const match = String(value).match(/\d+/);
  return match ? match[0] : defaultValue;
}

/**
 * Normalises TRL fields on every node in-place:
 *  - `trl_current` is always set (defaults to "1" if missing / non-numeric).
 *  - `trl_projected_5_10_years` is normalised only when the key already exists.
 *
 * Also warns about any unexpected trl_projected_* keys so data issues surface
 * early (mirrors the Python sanity check).
 */
function normalizeNodes(nodes: RawNode[]): RawNode[] {
  const badNodes: string[] = [];

  const normalized = nodes.map((node) => {
    const updated: RawNode = { ...node };

    // Always normalise trl_current
    updated.trl_current = toSingleTrl(node.trl_current, "1");

    // Only normalise projected TRL if the field already exists
    if ("trl_projected_5_10_years" in node) {
      updated.trl_projected_5_10_years = toSingleTrl(
        node.trl_projected_5_10_years
      );
    }

    // Detect unexpected trl_projected_* keys
    const unexpectedKeys = Object.keys(node).filter(
      (k) => k.startsWith("trl_projected") && k !== "trl_projected_5_10_years"
    );
    if (unexpectedKeys.length > 0) badNodes.push(node.id);

    return updated;
  });

  if (badNodes.length > 0) {
    console.warn(
      "WARNING: Nodes with inconsistent trl_projected keys:",
      badNodes.join(", ")
    );
  } else {
    console.log("TRL key consistency check passed: no unexpected keys.");
  }

  return normalized;
}

/**
 * Splits every edge that has multiple `targets` into individual one-to-one
 * edges, and re-formats each edge ID as:
 *   edge_src_{sourceId}_tgt_{targetId}
 *
 * Returns the normalised edge array plus the pre-calculated expected count so
 * the caller can run a sanity check.
 */
function normalizeTechTreeEdges(treeData: TechTreeData): {
  normalizedData: TechTreeData;
  expectedEdgeCount: number;
} {
  const originalEdges = treeData.graph.edges;

  // --- Pre-calculate expected count (sanity check) ---
  let expectedEdgeCount = 0;
  for (const edge of originalEdges) {
    if ("target" in edge) {
      expectedEdgeCount += 1;
    } else if (
      "targets" in edge &&
      Array.isArray((edge as RawEdgeMultiTarget).targets)
    ) {
      expectedEdgeCount += (edge as RawEdgeMultiTarget).targets.length;
    }
  }

  // --- Build normalized edge list ---
  const normalizedEdges: NormalizedEdge[] = [];

  for (const edge of originalEdges) {
    const sourceId = edge.source;
    if (!sourceId) continue; // Skip edges with no source

    if ("target" in edge) {
      // Case 1: single target
      const targetId = (edge as RawEdgeSingleTarget).target;
      normalizedEdges.push({
        id: `edge_src_${sourceId}_tgt_${targetId}`,
        source: sourceId,
        target: targetId,
      });
    } else if (
      "targets" in edge &&
      Array.isArray((edge as RawEdgeMultiTarget).targets)
    ) {
      // Case 2: multiple targets → explode into N individual edges
      for (const targetId of (edge as RawEdgeMultiTarget).targets) {
        normalizedEdges.push({
          id: `edge_src_${sourceId}_tgt_${targetId}`,
          source: sourceId,
          target: targetId,
        });
      }
    }
  }

  const normalizedData: TechTreeData = {
    graph: {
      ...treeData.graph,
      edges: normalizedEdges as unknown as RawEdge[],
    },
  };

  return { normalizedData, expectedEdgeCount };
}

// ---------------------------------------------------------------------------
// Sanity checks
// ---------------------------------------------------------------------------

function runEdgeSanityCheck(
  actualCount: number,
  expectedCount: number
): void {
  if (actualCount !== expectedCount) {
    throw new Error(
      `Edge sanity check FAILED: expected ${expectedCount} edges but got ${actualCount}.`
    );
  }
  console.log(
    `Edge sanity check passed: ${actualCount} edges match expected count.`
  );
}

function runReferenceSanityCheck(nodes: RawNode[]): void {
  const missing = nodes
    .filter((n) => !n.references || (n.references as string[]).length === 0)
    .map((n) => n.id);

  if (missing.length > 0) {
    throw new Error(
      `Reference sanity check FAILED. Nodes missing references: ${missing.join(", ")}`
    );
  }
  console.log("Reference sanity check passed: all nodes have references.");
}

function runIdConsistencyCheck(
  nodes: RawNode[],
  edges: NormalizedEdge[]
): void {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edgeEndpointIds = new Set<string>();
  for (const e of edges) {
    edgeEndpointIds.add(e.source);
    edgeEndpointIds.add(e.target);
  }

  const missingInNodes = [...edgeEndpointIds].filter((id) => !nodeIds.has(id));
  const isolatedNodes = [...nodeIds].filter((id) => !edgeEndpointIds.has(id));

  console.log("\n--- ID Consistency Check ---");
  if (missingInNodes.length === 0) {
    console.log("All source/target IDs in edges exist as nodes.");
  } else {
    console.warn(
      "WARNING: IDs present in edges but NOT found in nodes:",
      missingInNodes.join(", ")
    );
  }

  if (isolatedNodes.length === 0) {
    console.log("All nodes are referenced by at least one edge.");
  } else {
    console.warn(
      "WARNING: Nodes not referenced by any edge (isolated):",
      isolatedNodes.join(", ")
    );
  }
  console.log("--- Check Complete ---\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // 1. Read raw JSON data from disk
  console.log(`\nReading data from: ${JSON_FILE_PATH}`);
  if (!fs.existsSync(JSON_FILE_PATH)) {
    throw new Error(`JSON file not found at path: ${JSON_FILE_PATH}`);
  }
  const rawJson = fs.readFileSync(JSON_FILE_PATH, "utf-8");
  const techTree: TechTreeData = JSON.parse(rawJson);
  console.log(
    `   Loaded ${techTree.graph.nodes.length} nodes and ` +
      `${techTree.graph.edges.length} raw edges.`
  );

  // 2. Normalise TRL fields on nodes
  console.log("\nNormalizing node TRL fields...");
  techTree.graph.nodes = normalizeNodes(techTree.graph.nodes);

  // 3. Normalise edges (fan-out multi-target edges)
  console.log("\nNormalizing edges...");
  const originalEdgeCount = techTree.graph.edges.length;
  const { normalizedData, expectedEdgeCount } =
    normalizeTechTreeEdges(techTree);
  const finalEdges = normalizedData.graph.edges as unknown as NormalizedEdge[];
  const finalNodes = normalizedData.graph.nodes;

  console.log(`   Original edge count : ${originalEdgeCount}`);
  console.log(`   Expected after fan-out: ${expectedEdgeCount}`);
  console.log(`   Actual after fan-out : ${finalEdges.length}`);

  // 4. Run sanity checks
  console.log("\nRunning sanity checks...");
  runEdgeSanityCheck(finalEdges.length, expectedEdgeCount);
  runReferenceSanityCheck(finalNodes);
  runIdConsistencyCheck(finalNodes, finalEdges);

  // 5. Connect to MongoDB and seed
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI environment variable is not set. " +
        "Add it to your .env.local file or export it in your shell."
    );
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    // Quick connectivity check
    await client.db("admin").command({ ping: 1 });
    console.log("   Connected to MongoDB successfully.");

    const db = client.db(DB_NAME);
    const nodesCollection = db.collection("nodes");
    const edgesCollection = db.collection("edges");

    // 6. Wipe existing data
    console.log(`\nClearing existing data in "${DB_NAME}"...`);
    const deletedNodes = await nodesCollection.deleteMany({});
    const deletedEdges = await edgesCollection.deleteMany({});
    console.log(
      `   Removed ${deletedNodes.deletedCount} node(s) and ` +
        `${deletedEdges.deletedCount} edge(s).`
    );

    // 7. Insert fresh data
    console.log("\nInserting normalized data...");

    if (finalNodes.length > 0) {
      const nodesResult = await nodesCollection.insertMany(
        // Cast to satisfy the driver's Document type requirement
        finalNodes as Parameters<typeof nodesCollection.insertMany>[0]
      );
      console.log(
        `   Inserted ${nodesResult.insertedCount} document(s) into "nodes".`
      );
    } else {
      console.warn("   No nodes to insert.");
    }

    if (finalEdges.length > 0) {
      const edgesResult = await edgesCollection.insertMany(
        finalEdges as Parameters<typeof edgesCollection.insertMany>[0]
      );
      console.log(
        `   Inserted ${edgesResult.insertedCount} document(s) into "edges".`
      );
    } else {
      console.warn("   No edges to insert.");
    }

    console.log(
      `\nSuccessfully seeded ${finalNodes.length} nodes and ` +
        `${finalEdges.length} edges into "${DB_NAME}".`
    );
  } catch (err) {
    console.error("\nAn error occurred during the seeding process:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

main();