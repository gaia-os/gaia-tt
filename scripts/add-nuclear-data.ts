/**
 * scripts/add-nuclear-tt.ts
 *
 * Standalone seed script that reads the nuclear tech tree from a local
 * JSON file (nuclear_tt_v2.json), and upserts it into MongoDB.
 *
 * Note: nuclear_tt_v2.json is stored in Python dict literal format (single
 * quotes). This script converts it to valid JSON before parsing.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/add-nuclear-tt.ts
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

const JSON_FILE_PATH = path.resolve(__dirname, "../data/nuclear_tt_v2.json");
const DB_NAME = "nuclear_tt_db";

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
  subtype?: string;
  description?: string;
  references?: string[];
  [key: string]: unknown;
}

interface NormalizedEdge {
  id: string;
  source: string;
  target: string;
}

interface TechTreeGraph {
  nodes: RawNode[];
  edges: NormalizedEdge[];
}

interface TechTreeData {
  graph: TechTreeGraph;
}

// ---------------------------------------------------------------------------
// Python-dict → JSON conversion
// ---------------------------------------------------------------------------

/**
 * nuclear_tt_v2.json uses Python dict literal syntax (single quotes, True/False/None).
 * This function converts it to valid JSON so JSON.parse can handle it.
 */
function pythonDictToJson(raw: string): string {
  return raw
    // Replace single-quoted strings with double-quoted strings.
    // Handles escaped single quotes inside strings (\') → temporarily protected.
    .replace(/\\'/g, "\x00SQUOTE\x00")
    // Replace single-quoted string values/keys with double-quoted ones.
    // This regex matches a single-quote delimited token that may contain
    // escaped double quotes or any non-single-quote chars.
    .replace(/'([^']*)'/g, (_, content) => {
      // Re-escape any unescaped double quotes inside the content
      const escaped = content.replace(/"/g, '\\"');
      return `"${escaped}"`;
    })
    // Restore escaped single quotes as plain apostrophes (now inside double-quoted strings)
    .replace(/\x00SQUOTE\x00/g, "'")
    // Python booleans / None → JSON equivalents
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the first integer found in `value` and returns it as a string.
 * Falls back to `defaultValue` when no digit is found or the input is nullish.
 *
 * Since nuclear_tt_v2.json is already normalized (single integers as strings),
 * this is mostly a safety net.
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
 * Normalises TRL fields on every node in-place and warns about any
 * unexpected trl_projected_* keys.
 */
function normalizeNodes(nodes: RawNode[]): RawNode[] {
  const badNodes: string[] = [];

  const normalized = nodes.map((node) => {
    const updated: RawNode = { ...node };

    // Always normalise trl_current
    updated.trl_current = toSingleTrl(node.trl_current, "1");

    // Only normalise projected TRL if the field already exists on this node
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
  // 1. Read raw file from disk
  console.log(`\nReading data from: ${JSON_FILE_PATH}`);
  if (!fs.existsSync(JSON_FILE_PATH)) {
    throw new Error(`File not found at path: ${JSON_FILE_PATH}`);
  }
  const rawText = fs.readFileSync(JSON_FILE_PATH, "utf-8");

  // 2. Convert Python dict syntax to valid JSON
  console.log("Converting Python dict format to JSON...");
  const jsonText = pythonDictToJson(rawText);
  const techTree: TechTreeData = JSON.parse(jsonText);
  console.log(
    `   Loaded ${techTree.graph.nodes.length} nodes and ` +
      `${techTree.graph.edges.length} edges.`
  );

  // 3. Normalise TRL fields on nodes
  console.log("\nNormalizing node TRL fields...");
  techTree.graph.nodes = normalizeNodes(techTree.graph.nodes);

  const finalNodes = techTree.graph.nodes;
  const finalEdges = techTree.graph.edges;

  // 4. Run sanity checks
  console.log("\nRunning sanity checks...");
  // Edges are already fully normalized (all single-target), so expected === actual
  runEdgeSanityCheck(finalEdges.length, finalEdges.length);
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