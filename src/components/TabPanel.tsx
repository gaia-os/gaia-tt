'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Info, BarChart3 } from 'lucide-react';
import NodeDetails from './NodeDetails';
import Chat from './Chat';
import Simulations from './Simulations';
import { UiNode } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DATA } from '@/DATA';

interface TabPanelProps {
  selectedNode?: UiNode;
}

type TabType = 'details' | 'chat' | 'simulations';

const TabPanel = ({ selectedNode }: TabPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const previousNodeIdRef = useRef<string | undefined>(undefined);

  // Switch to details tab when a new node is selected while chat is active
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
    <div className="flex flex-col h-full bg-white shadow-lg">
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

        <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
          <Chat />
        </TabsContent>

        <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
          <NodeDetails selectedNode={selectedNode} />
        </TabsContent>

        <TabsContent value="simulations" className="flex-1 overflow-y-auto mt-0">
          <Simulations techTree={DATA} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabPanel;