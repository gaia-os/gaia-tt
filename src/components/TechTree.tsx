'use client';

import { getLayoutedElements } from '@/lib/elkjs';
import { HighlightedElements, UiNode, GroupingMode } from '@/lib/types';
import { TopicKey } from '@/lib/topicConfig';
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MarkerType,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Legend } from './Legend';
import { LoadingSpinner } from './LoadingSpinner';
import { GroupSelector } from './GroupSelector';
import { KnowledgeBaseSelector } from './KnowledgeBaseSelector';
import { CustomNode } from './CustomNode';
import TabPanel from './TabPanel';
import EditInterface from './EditInterface';
import { useTechTree } from '@/hooks/useTechTree';

// Suppress hydration warnings for Radix UI
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Hydration failed') &&
      args[0].includes('aria-controls')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

interface TechTreeProps {
  topic: TopicKey;
  onTopicChange: (value: TopicKey) => void;
}

const TechTree: React.FC<TechTreeProps> = ({ topic, onTopicChange }) => {
  const { techTree, isLoading: isLoadingData, error } = useTechTree(topic);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<UiNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<UiNode | undefined>(undefined);
  const [highlightedElements, setHighlightedElements] = useState<HighlightedElements>({
    nodeIds: new Set(),
    edgeIds: new Set(),
  });
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('None');
  const [showingRelatedNodes, setShowingRelatedNodes] = useState<string | null>(null);
  const [showOnlyConnected, setShowOnlyConnected] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const { fitView } = useReactFlow();

  // Extract unique categories from nodes
  const uniqueCategories = useMemo(() => {
    if (!techTree) return [];
    const categories = new Set<string>();
    categories.add('All');
    techTree.nodes.forEach(node => {
      if (node.data.category) {
        categories.add(node.data.category);
      }
    });
    return Array.from(categories).sort();
  }, [techTree]);

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleEnterEditMode = () => {
    const password = prompt('Please enter the admin password:');
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsEditing(true);
    } else if (password !== null) {
      alert('Incorrect password.');
    }
  };

  const handleExitEditMode = () => {
    if (window.confirm('Are you sure you want to exit edit mode? Any unsaved changes will be lost.')) {
      setIsEditing(false);
    }
  };

  // Function to find connected nodes and edges
  const findConnectedElements = useCallback(
    (nodeId: string, allEdges: Edge[]) => {
      const connectedNodeIds = new Set<string>();
      const connectedEdgeIds = new Set<string>();

      connectedNodeIds.add(nodeId);

      allEdges.forEach((edge) => {
        if (edge.source === nodeId || edge.target === nodeId) {
          connectedEdgeIds.add(edge.id);
          if (edge.source === nodeId) {
            connectedNodeIds.add(edge.target);
          }
          if (edge.target === nodeId) {
            connectedNodeIds.add(edge.source);
          }
        }
      });

      return { nodeIds: connectedNodeIds, edgeIds: connectedEdgeIds };
    },
    [],
  );

  useEffect(() => {
    setSearchTerm(searchInput);
  }, [searchInput, searchTerm]);

  useEffect(() => {
    if (!techTree) return;

    const loadLayout = async () => {
      setIsLoading(true);
      
      // Apply category filter
      let filteredTechTree = techTree;
      if (selectedCategory !== 'All') {
        filteredTechTree = {
          nodes: techTree.nodes.filter(node => node.data.category === selectedCategory),
          edges: techTree.edges.filter(edge => {
            const sourceExists = techTree.nodes.some(n => n.id === edge.source && n.data.category === selectedCategory);
            const targetExists = techTree.nodes.some(n => n.id === edge.target && n.data.category === selectedCategory);
            return sourceExists && targetExists;
          })
        };
      }
      
      const { layoutedNodes, layoutedEdges } = await getLayoutedElements(
        groupingMode,
        showingRelatedNodes,
        showOnlyConnected,
        searchTerm,
        filteredTechTree,
      );
      setNodes(() => layoutedNodes);
      setEdges(() => layoutedEdges);
      setIsLoading(false);
      fitView();
    };

    loadLayout();
  }, [
    fitView,
    groupingMode,
    showingRelatedNodes,
    showOnlyConnected,
    searchTerm,
    techTree,
    selectedCategory,
  ]);

  // Update node and edge styles based on highlighted elements
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
          borderWidth: highlightedElements.nodeIds.has(node.id) ? '3px' : '1px',
          boxShadow: highlightedElements.nodeIds.has(node.id)
            ? '0 0 0 2px #f97316'
            : 'none',
          fontWeight: highlightedElements.nodeIds.has(node.id)
            ? 'bold'
            : 'normal',
        },
      })),
    );

    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: highlightedElements.edgeIds.has(edge.id) ? 3 : 1,
          stroke: highlightedElements.edgeIds.has(edge.id)
            ? '#f97316'
            : '#374151',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: highlightedElements.edgeIds.has(edge.id)
            ? '#f97316'
            : '#374151',
        },
      })),
    );
  }, [highlightedElements]);

  const handleShowDetails = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(() => ({ ...node }));
        const connected = findConnectedElements(nodeId, edges);
        setHighlightedElements(connected);
        
        // Auto-expand panel on mobile when node details are shown
        if (window.innerWidth < 768) {
          setIsPanelExpanded(true);
        }
      }
    },
    [nodes, edges, findConnectedElements],
  );

  const handleShowConnected = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(() => ({ ...node }));
        setShowingRelatedNodes(nodeId);
        setShowOnlyConnected(true);
        setSearchInput('');
        setSearchTerm('');
        setHighlightedElements({ nodeIds: new Set(), edgeIds: new Set() });
      }
    },
    [nodes],
  );

  const handleGroupingModeChange = useCallback((mode: GroupingMode) => {
    setGroupingMode(mode);
    setSelectedNode(undefined);
    setShowingRelatedNodes(null);
    setShowOnlyConnected(false);
    setHighlightedElements({ nodeIds: new Set(), edgeIds: new Set() });
  }, []);

  const handleReset = useCallback(() => {
    setSelectedNode(undefined);
    setShowingRelatedNodes(null);
    setShowOnlyConnected(false);
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('All');
    setHighlightedElements({ nodeIds: new Set(), edgeIds: new Set() });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setSelectedNode(undefined);
    setShowingRelatedNodes(null);
    setShowOnlyConnected(false);
    setHighlightedElements({ nodeIds: new Set(), edgeIds: new Set() });
  }, []);

  return (
    <div className="w-full h-full bg-gray-100 flex">
      <div className={`relative transition-all duration-300 flex flex-col h-full ${
        isPanelExpanded 
          ? 'w-full md:w-2/4'
          : 'w-full'
      }`}>
        <GroupSelector
          currentMode={groupingMode}
          onModeChange={handleGroupingModeChange}
          selectedNode={selectedNode}
          showingConnectedNodes={showingRelatedNodes !== null}
          onReset={handleReset}
          searchInput={searchInput}
          onSearchChange={handleSearchChange}
          onEnterEditMode={handleEnterEditMode}
          isEditing={isEditing}
          showLegend={showLegend}
          showOptions={showOptions}
          onToggleLegend={() => setShowLegend(!showLegend)}
          onToggleOptions={() => setShowOptions(!showOptions)}
          selectedCategory={selectedCategory}
          categories={uniqueCategories}
          onCategoryChange={setSelectedCategory}
        />
        {isLoadingData || isLoading ? (
          <div className="flex-grow flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-grow relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={{
                default: (props) => (
                  <CustomNode
                    {...props}
                    onShowDetails={handleShowDetails}
                    onShowConnected={handleShowConnected}
                  />
                ),
              }}
              onNodesChange={undefined}
              onEdgesChange={undefined}
              onConnect={undefined}
              onEdgeClick={undefined}
              onNodeDragStop={undefined}
              draggable={false}
              nodesConnectable={false}
              colorMode={'light'}
              fitView
              fitViewOptions={{ padding: 0.5 }}
              minZoom={0.3}
              className="h-full w-full"
            >
              <Background bgColor="white" variant={BackgroundVariant.Dots} />
              <Controls 
                showInteractive={false} 
                showZoom={true} 
                showFitView={true}
                className="!left-4 !top-[180px] !bottom-auto md:!top-auto md:!bottom-4"
              />
            </ReactFlow>
            
            {/* Knowledge Base Selector - Positioned above Legend */}
            <KnowledgeBaseSelector topic={topic} onTopicChange={onTopicChange} />
            
            {/* Legend */}
            <div className={`${showLegend ? 'block' : 'hidden'} md:block`}>
              <Legend />
            </div>
          </div>
        )}
      </div>
      <div 
        className={`bg-white shadow-lg transition-all duration-300 relative ${
          isPanelExpanded 
            ? 'w-full md:w-2/4'
            : 'w-0'
        } ${
          isPanelExpanded ? 'fixed md:relative inset-0 md:inset-auto z-40 md:z-auto' : ''
        }`}
      >
        {isEditing ? (
          <EditInterface onExit={handleExitEditMode} topic={topic} />
        ) : (
          <TabPanel 
            selectedNode={selectedNode} 
            techTree={techTree}
            isPanelExpanded={isPanelExpanded}
            onTogglePanel={() => setIsPanelExpanded(!isPanelExpanded)}
            topic={topic}
          />
        )}
      </div>
    </div>
  );
};

export default TechTree;