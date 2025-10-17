/**
 * Export graph data from TypeScript DATA to JSON format for Python CLI testing
 *
 * Usage: npx tsx scripts/export-graph.ts
 */
import { writeFileSync } from 'fs';
import { DATA } from '../src/DATA';

const graphData = {
  nodes: DATA.nodes.map((node) => ({
    id: node.id,
    data: node.data,
  })),
  edges: DATA.edges,
};

const outputPath = 'graph.json';
writeFileSync(outputPath, JSON.stringify(graphData, null, 2));

console.log(`✅ Graph data exported to ${outputPath}`);
console.log(`   Nodes: ${graphData.nodes.length}`);
console.log(`   Edges: ${graphData.edges.length}`);
console.log(`\nTest the Python CLI with:`);
console.log(`   nuclear-scheduler --graph graph.json --years 20`);
