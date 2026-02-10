'use client';

import React from 'react';
import { NODE_LABELS, GroupingMode, UiNode } from '@/lib/types';
import { TopicKey, TOPICS } from '@/lib/topicConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Menu, Eye } from 'lucide-react';

interface GroupSelectorProps {
  currentMode: GroupingMode;
  onModeChange: (mode: GroupingMode) => void;
  selectedNode?: UiNode;
  showingConnectedNodes: boolean;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onEnterEditMode: () => void;
  isEditing: boolean;
  showLegend: boolean;
  showOptions: boolean;
  onToggleLegend: () => void;
  onToggleOptions: () => void;
  selectedCategory: string;
  categories: string[];
  onCategoryChange: (category: string) => void;
  topic: TopicKey;
  onTopicChange: (value: TopicKey) => void;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  currentMode,
  onModeChange,
  selectedNode,
  showingConnectedNodes,
  onReset,
  searchInput,
  onSearchChange,
  onEnterEditMode,
  isEditing,
  showLegend,
  showOptions,
  onToggleLegend,
  onToggleOptions,
  selectedCategory,
  categories,
  onCategoryChange,
  topic,
  onTopicChange,
}) => {
  const groupingOptions: GroupingMode[] = ['None', ...NODE_LABELS];

  const formatOptionLabel = (option: GroupingMode): string => {
    if (option === 'None') return 'No Grouping';
    return `${option}`;
  };

  const shouldShowReset = selectedNode !== undefined && showingConnectedNodes;

  return (
    <div className="absolute top-4 left-4 md:left-auto md:right-4 z-10">
      {shouldShowReset ? (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm bg-opacity-80">
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset to Show All Nodes
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile: Show toggle buttons */}
          <div className="md:hidden flex gap-2 mb-2">
            <Button
              variant={showLegend ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleLegend}
              className="flex items-center gap-2"
            >
              <Eye size={16} />
              Show Legend
            </Button>
            <Button
              variant={showOptions ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleOptions}
              className="flex items-center gap-2"
            >
              <Menu size={16} />
              More Options
            </Button>
          </div>

          {/* Desktop: Always show, Mobile: Show based on toggle */}
          <div className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm bg-opacity-80 space-y-3 ${
            showOptions ? 'block' : 'hidden md:block'
          }`}>
            {/* Knowledge Base Selector - NEW - At the top */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
              <label
                htmlFor="knowledge-base-select"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                Knowledge Base:
              </label>
              <Select value={topic} onValueChange={(value) => onTopicChange(value as TopicKey)}>
                <SelectTrigger className="w-48" id="knowledge-base-select">
                  <SelectValue placeholder="Select knowledge base" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TOPICS).map((topicItem) => (
                    <SelectItem key={topicItem.id} value={topicItem.id}>
                      {topicItem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="search-input"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                Search:
              </label>
              <div className="flex items-center">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search nodes..."
                  value={searchInput}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-48 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchInput && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 1 && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="category-filter"
                  className="text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  Category:
                </label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger className="w-48" id="category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Group By Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="group-selector"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                Group By:
              </label>
              <Select value={currentMode} onValueChange={onModeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select grouping mode" />
                </SelectTrigger>
                <SelectContent>
                  {groupingOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatOptionLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Edit Graph Button - Hidden on mobile */}
            {!isEditing && (
              <div className="pt-2 border-t border-gray-200 hidden md:block">
                <Button
                  variant="outline"
                  size="default"
                  onClick={onEnterEditMode}
                  className="w-full"
                >
                  Edit Tree
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};