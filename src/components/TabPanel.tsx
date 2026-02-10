'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Info, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import NodeDetails from './NodeDetails';
import Chat from './Chat';
import Simulations from './Simulations';
import { UiNode, TechTree } from '@/lib/types';
import { TopicKey } from '@/lib/topicConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface TabPanelProps {
  selectedNode?: UiNode;
  techTree: TechTree | null;
  isPanelExpanded: boolean;
  onTogglePanel: () => void;
  topic: TopicKey;
}

type TabType = 'details' | 'chat' | 'simulations';

const TabPanel = ({ selectedNode, techTree, isPanelExpanded, onTogglePanel, topic }: TabPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const previousNodeIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      selectedNode &&
      activeTab === 'chat' &&
      previousNodeIdRef.current !== selectedNode.id
    ) {
      setActiveTab('details');
    }
    previousNodeIdRef.current = selectedNode?.id;
  }, [selectedNode, activeTab]);

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onTogglePanel}
        className={`fixed z-50 bg-white border border-gray-200 shadow-md hover:bg-gray-50 transition-all duration-300 ${
          isPanelExpanded 
            ? 'top-4 right-4 md:top-4 md:right-[calc(50%-2.5rem)]'
            : 'top-4 right-4'
        }`}
        title={isPanelExpanded ? 'Collapse panel' : 'Expand panel'}
      >
        {isPanelExpanded ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </Button>

      {/* Panel container */}
      <div 
        className={`fixed top-0 right-0 z-40 h-full w-full md:w-1/2 flex flex-col bg-white shadow-lg transition-all duration-300 ${
          isPanelExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="flex flex-col h-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare size={16} />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center space-x-2">
              <Info size={16} />
              <span>Node Details</span>
            </TabsTrigger>
            <TabsTrigger value="simulations" className="flex items-center space-x-2">
              <BarChart3 size={16} />
              <span>Simulations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 overflow-y-auto mt-0">
            <Chat topic={topic} />
          </TabsContent>

          <TabsContent value="details" className="flex-1 overflow-y-auto mt-0">
            <NodeDetails selectedNode={selectedNode} />
          </TabsContent>

          <TabsContent value="simulations" className="flex-1 overflow-y-auto mt-0">
            <Simulations topic={topic} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default TabPanel;