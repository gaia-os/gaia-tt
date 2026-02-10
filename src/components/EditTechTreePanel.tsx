'use client';

import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { NODE_LABELS, NodeLabel } from '@/lib/types';
import { TopicKey } from '@/lib/topicConfig';
import { useTechTree } from '@/hooks/useTechTree';

interface EditTechTreePanelProps {
  topic: TopicKey; // NEW: Accept topic prop
}

const EditTechTreePanel: React.FC<EditTechTreePanelProps> = ({ topic }) => {
  const { techTree } = useTechTree(topic); // Use topic to fetch correct tree
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Node State
  const [newNode, setNewNode] = useState({
    id: '',
    label: '',
    type: 'Milestone' as NodeLabel,
    category: '',
    subtype: '',
    trl_current: '',
    trl_projected_5_10_years: '',
    detailedDescription: '',
    references: '',
    edgeSource: '',
    edgeTarget: '',
  });

  // Edit Node State
  const [editNodeSelection, setEditNodeSelection] = useState('');
  const [editNode, setEditNode] = useState({
    label: '',
    type: 'Milestone' as NodeLabel,
    category: '',
    subtype: '',
    trl_current: '',
    trl_projected_5_10_years: '',
    detailedDescription: '',
    references: '',
  });

  // Delete Node State
  const [deleteNodeSelection, setDeleteNodeSelection] = useState('');

  // Edge State
  const [newEdge, setNewEdge] = useState({
    source: '',
    target: '',
  });
  const [deleteEdgeSelection, setDeleteEdgeSelection] = useState('');

  // Create node options for dropdowns (sorted alphabetically)
  const nodeOptions = useMemo(() => {
    if (!techTree) return [];
    return techTree.nodes
      .map(node => ({
        id: node.id,
        label: node.data.label,
        displayText: `${node.data.label} (${node.id})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [techTree]);

  // Create edge options for dropdowns
  const edgeOptions = useMemo(() => {
    if (!techTree) return [];
    return techTree.edges.map(edge => ({
      id: edge.id,
      displayText: `${edge.source} → ${edge.target}`,
    }));
  }, [techTree]);

  const handleAddNode = async () => {
    if (!newNode.id || !newNode.label) {
      setMessage({ type: 'error', text: 'ID and Label are required' });
      return;
    }

    if (!newNode.edgeSource && !newNode.edgeTarget) {
      setMessage({ type: 'error', text: 'At least one edge connection is required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // First, create the node - include topic in body
      const nodeResponse = await fetch('/investment-tech-tree/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newNode.id,
          label: newNode.label,
          type: newNode.type,
          category: newNode.category,
          subtype: newNode.subtype,
          trl_current: newNode.trl_current,
          trl_projected_5_10_years: newNode.trl_projected_5_10_years,
          detailedDescription: newNode.detailedDescription,
          references: newNode.references.split('\n').filter(r => r.trim()),
          topic: topic, // Include topic
        }),
      });

      if (!nodeResponse.ok) {
        const error = await nodeResponse.json();
        throw new Error(error.error || 'Failed to add node');
      }

      // Then, create edges - include topic in body
      if (newNode.edgeSource) {
        const edgeResponse = await fetch('/investment-tech-tree/api/edges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: newNode.edgeSource,
            target: newNode.id,
            topic: topic, // Include topic
          }),
        });
        if (!edgeResponse.ok) {
          throw new Error('Failed to create source edge');
        }
      }

      if (newNode.edgeTarget) {
        const edgeResponse = await fetch('/investment-tech-tree/api/edges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: newNode.id,
            target: newNode.edgeTarget,
            topic: topic, // Include topic
          }),
        });
        if (!edgeResponse.ok) {
          throw new Error('Failed to create target edge');
        }
      }

      setMessage({ type: 'success', text: 'Node and edges added successfully' });
      setNewNode({
        id: '',
        label: '',
        type: 'Milestone',
        category: '',
        subtype: '',
        trl_current: '',
        trl_projected_5_10_years: '',
        detailedDescription: '',
        references: '',
        edgeSource: '',
        edgeTarget: '',
      });

      window.location.reload();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to add node',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNode = async () => {
    if (!editNodeSelection) {
      setMessage({ type: 'error', text: 'Please select a node first' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/investment-tech-tree/api/nodes/${editNodeSelection}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editNode,
          references: editNode.references.split('\n').filter(r => r.trim()),
          topic: topic, // Include topic
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update node');
      }

      setMessage({ type: 'success', text: 'Node updated successfully' });
      window.location.reload();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update node',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!deleteNodeSelection) {
      setMessage({ type: 'error', text: 'Please select a node' });
      return;
    }

    const node = nodeOptions.find(n => n.id === deleteNodeSelection);
    if (!window.confirm(`Are you sure you want to delete "${node?.label}"?`)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Include topic in query params for DELETE
      const response = await fetch(`/investment-tech-tree/api/nodes/${deleteNodeSelection}?topic=${topic}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete node');
      }

      setMessage({ type: 'success', text: 'Node deleted successfully' });
      setDeleteNodeSelection('');
      window.location.reload();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete node',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEdge = async () => {
    if (!newEdge.source || !newEdge.target) {
      setMessage({ type: 'error', text: 'Source and Target are required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/investment-tech-tree/api/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEdge,
          topic: topic, // Include topic
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add edge');
      }

      setMessage({ type: 'success', text: 'Edge added successfully' });
      setNewEdge({ source: '', target: '' });
      window.location.reload();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to add edge',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEdge = async () => {
    if (!deleteEdgeSelection) {
      setMessage({ type: 'error', text: 'Please select an edge' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this edge?`)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Include topic in query params for DELETE
      const response = await fetch(`/investment-tech-tree/api/edges/${deleteEdgeSelection}?topic=${topic}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete edge');
      }

      setMessage({ type: 'success', text: 'Edge deleted successfully' });
      setDeleteEdgeSelection('');
      window.location.reload();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete edge',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {message && (
        <Card className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <CardContent className="pt-4">
            <p className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <Accordion type="single" collapsible className="w-full">
        {/* Add Node */}
        <AccordionItem value="add-node">
          <AccordionTrigger>Add Node</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Node ID</label>
                <Input
                  value={newNode.id}
                  onChange={(e) => setNewNode({ ...newNode, id: e.target.value })}
                  placeholder="e.g., concept_new_reactor"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={newNode.label}
                  onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                  placeholder="Display name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={newNode.type} onValueChange={(value: NodeLabel) => setNewNode({ ...newNode, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NODE_LABELS.map(label => (
                      <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newNode.category}
                  onChange={(e) => setNewNode({ ...newNode, category: e.target.value })}
                  placeholder="e.g., fusion, fission, coal, natural_gas"
                />
              </div>
              <div>
                <label className="text-sm font-medium">TRL Current</label>
                <Input
                  value={newNode.trl_current}
                  onChange={(e) => setNewNode({ ...newNode, trl_current: e.target.value })}
                  placeholder="e.g., 3-4"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newNode.detailedDescription}
                  onChange={(e) => setNewNode({ ...newNode, detailedDescription: e.target.value })}
                  placeholder="Detailed description"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">References (one per line)</label>
                <Textarea
                  value={newNode.references}
                  onChange={(e) => setNewNode({ ...newNode, references: e.target.value })}
                  placeholder="Reference URLs or citations"
                  rows={3}
                />
              </div>
              <div className="border-t pt-3">
                <label className="text-sm font-medium">Required: Connect to Existing Node(s)</label>
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs text-gray-600">Incoming Edge (Node → This Node)</label>
                    <Select value={newNode.edgeSource} onValueChange={(value) => setNewNode({ ...newNode, edgeSource: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source node (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeOptions.map(node => (
                          <SelectItem key={node.id} value={node.id}>{node.displayText}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Outgoing Edge (This Node → Node)</label>
                    <Select value={newNode.edgeTarget} onValueChange={(value) => setNewNode({ ...newNode, edgeTarget: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target node (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeOptions.map(node => (
                          <SelectItem key={node.id} value={node.id}>{node.displayText}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button onClick={handleAddNode} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Add Node'}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Edit Node */}
        <AccordionItem value="edit-node">
          <AccordionTrigger>Edit Node</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Select Node to Edit</label>
                <Select 
                  value={editNodeSelection} 
                  onValueChange={(nodeId) => {
                    if (!techTree) return;
                    const node = techTree.nodes.find(n => n.id === nodeId);
                    if (!node) {
                      setMessage({ type: 'error', text: 'Node not found' });
                      return;
                    }
                    
                    setEditNodeSelection(nodeId);
                    setEditNode({
                      label: node.data.label,
                      type: node.data.nodeLabel,
                      category: node.data.category || '',
                      subtype: node.data.subtype || '',
                      trl_current: node.data.trl_current || '',
                      trl_projected_5_10_years: node.data.trl_projected_5_10_years || '',
                      detailedDescription: node.data.detailedDescription || '',
                      references: (node.data.references || []).join('\n'),
                    });
                    setMessage(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select node to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeOptions.map(node => (
                      <SelectItem key={node.id} value={node.id}>{node.displayText}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editNodeSelection && (
                <>
                  <div>
                    <label className="text-sm font-medium">Label</label>
                    <Input
                      value={editNode.label}
                      onChange={(e) => setEditNode({ ...editNode, label: e.target.value })}
                      placeholder="Display name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={editNode.type} onValueChange={(value: NodeLabel) => setEditNode({ ...editNode, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NODE_LABELS.map(label => (
                          <SelectItem key={label} value={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      value={editNode.category}
                      onChange={(e) => setEditNode({ ...editNode, category: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">TRL Current</label>
                    <Input
                      value={editNode.trl_current}
                      onChange={(e) => setEditNode({ ...editNode, trl_current: e.target.value })}
                      placeholder="e.g., 3-4"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editNode.detailedDescription}
                      onChange={(e) => setEditNode({ ...editNode, detailedDescription: e.target.value })}
                      placeholder="Detailed description"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">References (one per line)</label>
                    <Textarea
                      value={editNode.references}
                      onChange={(e) => setEditNode({ ...editNode, references: e.target.value })}
                      placeholder="Reference URLs or citations"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleUpdateNode} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Update Node'}
                  </Button>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Delete Node */}
        <AccordionItem value="delete-node">
          <AccordionTrigger>Delete Node</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Select Node to Delete</label>
                <Select value={deleteNodeSelection} onValueChange={setDeleteNodeSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select node to delete" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeOptions.map(node => (
                      <SelectItem key={node.id} value={node.id}>{node.displayText}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleDeleteNode} disabled={isLoading} variant="destructive" className="w-full">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Delete Node'}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Manage Edges */}
        <AccordionItem value="manage-edges">
          <AccordionTrigger>Manage Edges</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Add Edge</h4>
                <div>
                  <label className="text-sm font-medium">Source Node</label>
                  <Select value={newEdge.source} onValueChange={(value) => setNewEdge({ ...newEdge, source: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source node" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodeOptions.map(node => (
                        <SelectItem key={node.id} value={node.id}>{node.displayText}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Node</label>
                  <Select value={newEdge.target} onValueChange={(value) => setNewEdge({ ...newEdge, target: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target node" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodeOptions.map(node => (
                        <SelectItem key={node.id} value={node.id}>{node.displayText}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEdge} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Add Edge'}
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Delete Edge</h4>
                <div>
                  <label className="text-sm font-medium">Select Edge to Delete</label>
                  <Select value={deleteEdgeSelection} onValueChange={setDeleteEdgeSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select edge to delete" />
                    </SelectTrigger>
                    <SelectContent>
                      {edgeOptions.map(edge => (
                        <SelectItem key={edge.id} value={edge.id}>{edge.displayText}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleDeleteEdge} disabled={isLoading} variant="destructive" className="w-full">
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Delete Edge'}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default EditTechTreePanel;