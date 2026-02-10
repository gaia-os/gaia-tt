import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { TechTree } from '@/lib/types';
import { TOPICS, TopicKey } from '@/lib/topicConfig';

export async function GET(request: NextRequest) {
  try {
    // Get topic from query parameters
    const topic = request.nextUrl.searchParams.get('topic') as TopicKey;
    
    if (!topic || !TOPICS[topic]) {
      return NextResponse.json(
        { error: 'Invalid or missing topic parameter' },
        { status: 400 }
      );
    }

    const topicConfig = TOPICS[topic];

    // Check if we're in a build environment and MongoDB URI is not available
    if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
      console.warn('MongoDB URI not available during build, returning empty tech tree');
      return NextResponse.json({
        nodes: [],
        edges: []
      });
    }

    const client = await clientPromise;
    const db = client.db(topicConfig.dbName); // Dynamic database selection

    // Fetch nodes and edges from MongoDB
    const nodesCollection = db.collection('nodes');
    const edgesCollection = db.collection('edges');

    const nodes = await nodesCollection.find({}).toArray();
    const edges = await edgesCollection.find({}).toArray();

    // Transform MongoDB documents to match your TechTree type
    const techTree: TechTree = {
      nodes: nodes.map((node) => ({
        id: node.id,
        data: {
          label: node.label,
          nodeLabel: node.type,
          description: node.label,
          detailedDescription: node.description || node.detailedDescription,
          category: node.category,
          subtype: node.subtype,
          trl_current: node.trl_current,
          trl_projected_5_10_years: node.trl_projected_5_10_years,
          references: node.references || [],
          infact_analysis: node.infact_analysis,
          infact_analysis_html_content: node.infact_analysis_html_content,
          infact_status: node.infact_status,
        },
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    };

    return NextResponse.json(techTree);
  } catch (error) {
    console.error('Error fetching tech tree data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tech tree data' },
      { status: 500 }
    );
  }
}