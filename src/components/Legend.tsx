'use client';

import { LABEL_COLORS, NODE_LABELS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Legend = () => {
  return (
    <Card
      className="absolute top-[160px] left-4"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {NODE_LABELS.map((label) => (
          <div key={label} className="flex items-center space-x-2">
            <span
              className={`w-4 h-4 rounded bg-${LABEL_COLORS[label]}`}
            ></span>
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};