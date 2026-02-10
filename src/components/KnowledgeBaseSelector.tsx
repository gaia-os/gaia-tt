'use client';

import React from 'react';
import { TopicKey, TOPICS } from '@/lib/topicConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database } from 'lucide-react';

interface KnowledgeBaseSelectorProps {
  topic: TopicKey;
  onTopicChange: (value: TopicKey) => void;
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  topic,
  onTopicChange,
}) => {
  return (
    <div className="absolute top-6 left-4 z-10">
      <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg p-4 backdrop-blur-sm bg-opacity-90 w-fit">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gray-800 p-2 rounded-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 tracking-wide">
            SELECT TECH TREE
          </h3>
        </div>
        <Select value={topic} onValueChange={(value) => onTopicChange(value as TopicKey)}>
          <SelectTrigger className="w-full h-10 bg-white border-gray-300 hover:border-gray-500 focus:ring-2 focus:ring-gray-400 transition-all shadow-sm font-medium">
            <SelectValue placeholder="Select tech tree" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TOPICS).map((topicItem) => (
              <SelectItem 
                key={topicItem.id} 
                value={topicItem.id}
                className="font-medium hover:bg-gray-100 cursor-pointer"
              >
                {topicItem.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};