import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { runSimulation } from '@/lib/simulation';
import { TOPICS, TopicKey } from '@/lib/topicConfig';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const years = parseInt(searchParams.get('years') || '30');
    const topic = searchParams.get('topic') as TopicKey;

    console.log('🔍 Simulation requested:', { years, topic });

    // Validate topic parameter
    if (!topic || !TOPICS[topic]) {
      return NextResponse.json(
        { error: 'Invalid or missing topic parameter' },
        { status: 400 }
      );
    }

    // Validate years parameter
    if (years < 5 || years > 30) {
      return NextResponse.json(
        { error: 'Years parameter must be between 5 and 30' },
        { status: 400 }
      );
    }

    const topicConfig = TOPICS[topic];

    const client = await clientPromise;
    const db = client.db(topicConfig.dbName); // Dynamic database selection

    // Fetch nodes and edges from MongoDB
    const nodesCollection = db.collection('nodes');
    const edgesCollection = db.collection('edges');

    const [nodes, edges] = await Promise.all([
      nodesCollection.find({}).toArray(),
      edgesCollection.find({}).toArray(),
    ]);

    // Prepare tech tree structure
    const techTree = {
      graph: {
        nodes: nodes.map(({ _id, ...rest }) => rest),
        edges: edges.map(({ _id, ...rest }) => rest),
      },
    };

    console.log('📊 Tech tree loaded:', {
      topic: topicConfig.label,
      database: topicConfig.dbName,
      nodeCount: techTree.graph.nodes.length,
      edgeCount: techTree.graph.edges.length
    });

    // Run simulation
    const results = runSimulation(techTree, years);

    // DEBUG: Check the year range in results
    const impactYears = new Set<number>();
    Object.values(results.impactData).forEach((techData) => {
      Object.keys(techData).forEach((year) => impactYears.add(parseInt(year)));
    });
    const sortedImpactYears = Array.from(impactYears).sort((a, b) => a - b);

    console.log('✅ Simulation complete:', {
      requestedYears: years,
      expectedEndYear: 2026 + years,
      impactDataYearRange: {
        first: sortedImpactYears[0],
        last: sortedImpactYears[sortedImpactYears.length - 1],
        count: sortedImpactYears.length
      },
      technologiesCount: Object.keys(results.impactData).length
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error running simulation:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    );
  }
}