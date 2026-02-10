'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, Bot } from 'lucide-react';
import EditTechTreePanel from './EditTechTreePanel';
import AiAssistantPanel from './AiAssistantPanel';
import { TopicKey } from '@/lib/topicConfig';

interface EditInterfaceProps {
  onExit: () => void;
  topic: TopicKey; // NEW: Accept topic prop
}

const EditInterface: React.FC<EditInterfaceProps> = ({ onExit, topic }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'ai'>('edit');

  return (
    <div className="flex flex-col h-full bg-white shadow-lg">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Mode</h2>
          <Button
            variant="outline"
            size="default"
            onClick={onExit}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Explore Mode
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'edit' | 'ai')}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Database size={16} />
            <span>Edit Tech Tree</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot size={16} />
            <span>AI Assistant</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 overflow-hidden mt-0 p-6">
          <EditTechTreePanel topic={topic} /> {/* Pass topic */}
        </TabsContent>

        <TabsContent value="ai" className="flex-1 overflow-hidden mt-0 p-6">
          <AiAssistantPanel topic={topic} /> {/* Pass topic */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditInterface;