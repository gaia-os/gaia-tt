import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Using simple label instead of UI component
import { TechTree } from '@/lib/types';
import { NuclearScheduler, calculateSummaryStats } from '@/lib/nuclearScheduler';
import { Loader2 } from 'lucide-react';

interface SimulationsProps {
  techTree: TechTree;
}

interface HeatmapData {
  technology: string;
  year: number;
  impact: number;
}

const Simulations: React.FC<SimulationsProps> = ({ techTree }) => {
  const [yearsToSimulate, setYearsToSimulate] = useState(20);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [minImpact, setMinImpact] = useState(0);
  const [showAllTechs, setShowAllTechs] = useState(false);

  const scheduler = useMemo(() => new NuclearScheduler(techTree), [techTree]);

  const runSimulation = async () => {
    setIsRunning(true);
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      const results = scheduler.runSimulation(yearsToSimulate);
      setSimulationResults(results);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const heatmapData = useMemo(() => {
    if (!simulationResults) return [];
    
    // First, filter technologies based on their first year impact
    const firstYear = Math.min(...Object.values(simulationResults.impactData).flatMap(yearlyImpact => 
      Object.keys(yearlyImpact as Record<number, number>).map(Number)
    ));
    
    const eligibleTechs = Object.entries(simulationResults.impactData)
      .filter(([tech, yearlyImpact]) => {
        const firstYearImpact = (yearlyImpact as Record<number, number>)[firstYear] || 0;
        return firstYearImpact >= minImpact;
      })
      .map(([tech]) => tech);
    
    // Then create data for all years for eligible technologies
    const data: HeatmapData[] = [];
    Object.entries(simulationResults.impactData).forEach(([tech, yearlyImpact]) => {
      if (eligibleTechs.includes(tech)) {
        Object.entries(yearlyImpact as Record<number, number>).forEach(([year, impact]) => {
          data.push({
            technology: tech,
            year: parseInt(year),
            impact: impact
          });
        });
      }
    });

    // Sort by impact and limit to top technologies if not showing all
    data.sort((a, b) => b.impact - a.impact);
    
    if (!showAllTechs) {
      const topTechs = Array.from(new Set(data.map(d => d.technology))).slice(0, 15);
      return data.filter(d => topTechs.includes(d.technology));
    }
    
    return data;
  }, [simulationResults, minImpact, showAllTechs]);

  const summaryStats = useMemo(() => {
    if (!simulationResults) return null;
    return calculateSummaryStats(simulationResults.impactData);
  }, [simulationResults]);

  const renderHeatmap = () => {
    if (!heatmapData.length) return null;

    const technologies = Array.from(new Set(heatmapData.map(d => d.technology)));
    const years = Array.from(new Set(heatmapData.map(d => d.year))).sort((a, b) => a - b);
    const maxImpact = Math.max(...heatmapData.map(d => d.impact));

    return (
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-1 gap-2" style={{ gridTemplateColumns: `200px repeat(${years.length}, 40px)` }}>
            {/* Header */}
            <div className="font-semibold text-sm p-2">Technology</div>
            {years.map(year => (
              <div key={year} className="font-semibold text-xs p-1 text-center h-12 flex items-end justify-center">
                <span className="transform -rotate-45 origin-bottom whitespace-nowrap">
                  {year}
                </span>
              </div>
            ))}
            
            {/* Data rows */}
            {technologies.map(tech => (
              <React.Fragment key={tech}>
                <div className="text-xs p-2 border-r truncate" title={tech}>
                  {tech}
                </div>
                {years.map(year => {
                  const dataPoint = heatmapData.find(d => d.technology === tech && d.year === year);
                  const intensity = dataPoint ? dataPoint.impact / maxImpact : 0;
                  const hasData = dataPoint && dataPoint.impact > 0;
                  const color = hasData 
                    ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})` 
                    : 'rgba(156, 163, 175, 0.3)'; // Light grey for no data
                  
                  return (
                    <div
                      key={`${tech}-${year}`}
                      className="h-8 border border-gray-200 flex items-center justify-center text-xs cursor-pointer hover:border-gray-400"
                      style={{ backgroundColor: color }}
                      title={hasData ? `${tech} (${year}): ${dataPoint.impact.toFixed(2)} TWh` : `${tech} (${year}): No impact`}
                    >
                      {hasData ? dataPoint.impact.toFixed(1) : '0.0'}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuclear Investment Simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="years" className="text-sm font-medium">Years to Simulate</label>
              <Input
                id="years"
                type="number"
                min="1"
                max="50"
                value={yearsToSimulate}
                onChange={(e) => setYearsToSimulate(parseInt(e.target.value) || 20)}
                className="w-32"
              />
            </div>
            <Button 
              onClick={runSimulation} 
              disabled={isRunning}
              className="mt-6"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Simulation'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {summaryStats && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summaryStats.totalTechs}</div>
                <div className="text-sm text-gray-600">Total Technologies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summaryStats.activeTechs}</div>
                <div className="text-sm text-gray-600">Active Technologies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summaryStats.maxImpact.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Max Impact (TWh)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summaryStats.currentOpportunities}</div>
                <div className="text-sm text-gray-600">Current Opportunities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {simulationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Impact Heatmap</CardTitle>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="minImpact" className="text-sm font-medium">Min Impact (TWh)</label>
                <Input
                  id="minImpact"
                  type="number"
                  min="0"
                  step="0.1"
                  value={minImpact}
                  onChange={(e) => setMinImpact(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="showAll"
                  checked={showAllTechs}
                  onChange={(e) => setShowAllTechs(e.target.checked)}
                />
                <label htmlFor="showAll" className="text-sm font-medium">Show All Technologies</label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {heatmapData.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Impact values represent the potential energy output (TWh) gained by accelerating technology development by one year.
                  Darker blue indicates higher impact.
                </div>
                {renderHeatmap()}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No data meets the current filter criteria. Try reducing the minimum impact threshold.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {simulationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Technology Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(simulationResults.statusData).map(([tech, yearlyStatus]) => {
                const statusEntries = Object.entries(yearlyStatus as Record<number, string>);
                if (statusEntries.length === 0) return null;
                
                return (
                  <div key={tech} className="flex items-center space-x-2 p-2 border rounded">
                    <div className="w-48 text-sm font-medium truncate" title={tech}>
                      {tech}
                    </div>
                    <div className="flex space-x-1 flex-1 overflow-x-auto">
                      {statusEntries.slice(0, 20).map(([year, status]) => (
                        <div
                          key={year}
                          className={`w-4 h-4 rounded text-xs flex items-center justify-center ${
                            status === 'Completed' ? 'bg-green-500' :
                            status === 'Active' ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          title={`${year}: ${status}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Simulations;