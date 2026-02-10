import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { TOPICS, TopicKey } from '@/lib/topicConfig';

// PUT - Update an existing node
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nodeId } = await params;
    const body = await request.json();

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

    // Check if node exists
    const existing = await nodesCollection.findOne({ id: nodeId });
    if (!existing) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    // Build update document
    const updateDoc: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.label !== undefined) updateDoc.label = body.label;
    if (body.type !== undefined) updateDoc.type = body.type;
    if (body.category !== undefined) updateDoc.category = body.category;
    if (body.subtype !== undefined) updateDoc.subtype = body.subtype;
    if (body.trl_current !== undefined) updateDoc.trl_current = body.trl_current;
    if (body.trl_projected_5_10_years !== undefined) {
      updateDoc.trl_projected_5_10_years = body.trl_projected_5_10_years;
    }
    if (body.detailedDescription !== undefined) {
      updateDoc.description = body.detailedDescription;
      updateDoc.detailedDescription = body.detailedDescription;
    }
    if (body.references !== undefined) updateDoc.references = body.references;

    await nodesCollection.updateOne(
      { id: nodeId },
      { $set: updateDoc }
    );

    return NextResponse.json(
      { success: true, message: 'Node updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a node
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nodeId } = await params;
    
    // Get topic from query parameters for DELETE
    const topic = request.nextUrl.searchParams.get('topic') as TopicKey;
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
    const edgesCollection = db.collection('edges');

    // Check if node exists
    const existing = await nodesCollection.findOne({ id: nodeId });
    if (!existing) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    // Delete the node
    await nodesCollection.deleteOne({ id: nodeId });

    // Delete all edges connected to this node
    await edgesCollection.deleteMany({
      $or: [{ source: nodeId }, { target: nodeId }],
    });

    return NextResponse.json(
      { success: true, message: 'Node and related edges deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    );
  }
}