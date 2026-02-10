import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { TOPICS, TopicKey } from '@/lib/topicConfig';

// POST - Create a new edge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.source || !body.target) {
      return NextResponse.json(
        { error: 'Missing required fields: source, target' },
        { status: 400 }
      );
    }

    // Get and validate topic
    const topic = body.topic as TopicKey;
    if (!topic || !TOPICS[topic]) {
      return NextResponse.json(
        { error: 'Invalid or missing topic parameter' },
        { status: 400 }
      );
    }

    const topicConfig = TOPICS[topic];

    const client = await clientPromise;
    const db = client.db(topicConfig.dbName); // Dynamic database selection
    const edgesCollection = db.collection('edges');
    const nodesCollection = db.collection('nodes');

    // Verify that both source and target nodes exist
    const sourceNode = await nodesCollection.findOne({ id: body.source });
    const targetNode = await nodesCollection.findOne({ id: body.target });

    if (!sourceNode) {
      return NextResponse.json(
        { error: `Source node '${body.source}' not found` },
        { status: 404 }
      );
    }

    if (!targetNode) {
      return NextResponse.json(
        { error: `Target node '${body.target}' not found` },
        { status: 404 }
      );
    }

    // Generate edge ID
    const edgeId = `${body.source}-${body.target}`;

    // Check if edge already exists
    const existing = await edgesCollection.findOne({ id: edgeId });
    if (existing) {
      return NextResponse.json(
        { error: 'Edge already exists between these nodes' },
        { status: 409 }
      );
    }

    // Create edge document
    const edgeDoc = {
      id: edgeId,
      source: body.source,
      target: body.target,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await edgesCollection.insertOne(edgeDoc);

    return NextResponse.json(
      { success: true, message: 'Edge created successfully', id: edgeId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating edge:', error);
    return NextResponse.json(
      { error: 'Failed to create edge' },
      { status: 500 }
    );
  }
}