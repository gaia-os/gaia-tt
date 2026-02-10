import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { TOPICS, TopicKey } from '@/lib/topicConfig';

// POST - Create a new node
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.label || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: id, label, type' },
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
    const nodesCollection = db.collection('nodes');

    // Check if node with this ID already exists
    const existing = await nodesCollection.findOne({ id: body.id });
    if (existing) {
      return NextResponse.json(
        { error: 'Node with this ID already exists' },
        { status: 409 }
      );
    }

    // Create node document
    const nodeDoc = {
      id: body.id,
      label: body.label,
      type: body.type,
      category: body.category || null,
      subtype: body.subtype || null,
      trl_current: body.trl_current || null,
      trl_projected_5_10_years: body.trl_projected_5_10_years || null,
      description: body.detailedDescription || null,
      detailedDescription: body.detailedDescription || null,
      references: body.references || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await nodesCollection.insertOne(nodeDoc);

    return NextResponse.json(
      { success: true, message: 'Node created successfully', id: body.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    );
  }
}