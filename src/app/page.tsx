'use client';

import { useState } from 'react';
import TechTree from '@/components/TechTree';
import { ReactFlowProvider } from '@xyflow/react';
import { TopicKey, DEFAULT_TOPIC } from '@/lib/topicConfig';
import '@xyflow/react/dist/style.css';

export default function Home() {
  const [currentTopic, setCurrentTopic] = useState<TopicKey>(DEFAULT_TOPIC.id);

  return (
    <div className="h-screen">
      <ReactFlowProvider>
        <TechTree 
          topic={currentTopic} 
          onTopicChange={(value) => setCurrentTopic(value as TopicKey)} 
        />
      </ReactFlowProvider>
    </div>
  );
}