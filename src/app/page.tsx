'use client';

import { useState } from 'react';
import TechTree from '@/components/TechTree';
import { ReactFlowProvider } from '@xyflow/react';
import { TOPICS, TopicKey, DEFAULT_TOPIC } from '@/lib/topicConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import '@xyflow/react/dist/style.css';

export default function Home() {
  const [currentTopic, setCurrentTopic] = useState<TopicKey>(DEFAULT_TOPIC.id);

  return (
    <div className="h-screen flex flex-col">
      {/* Topic Selector Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm z-50">
        <h1 className="text-lg font-semibold text-gray-800">
          Investment Tech Tree
        </h1>
        <div className="flex items-center gap-2">
          <label htmlFor="topic-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Knowledge Base:
          </label>
          <Select value={currentTopic} onValueChange={(value) => setCurrentTopic(value as TopicKey)}>
            <SelectTrigger className="w-48" id="topic-select">
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TOPICS).map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <ReactFlowProvider>
          <TechTree topic={currentTopic} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}