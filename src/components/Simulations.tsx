import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { TopicKey } from '@/lib/topicConfig';

interface SimulationData {
  impactData: Record<string, Record<string, number>>;
  statusData: Record<string, Record<string, string>>;
}

interface SimulationsProps {
  topic: TopicKey; // NEW: Accept topic prop
}

const Simulations: React.FC<SimulationsProps> = ({ topic }) => {
  const [selectedYears, setSelectedYears] = useState<string>('30');
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate year options from 5 to 30 in increments of 5
  const yearOptions = useMemo(() => {
    const options = [];
    for (let i = 5; i <= 30; i += 5) {
      options.push(i.toString());
    }
    return options;
  }, []);

  // Fetch simulation data when years or topic changes
  useEffect(() => {
    const fetchSimulation = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Include topic in API call
        const response = await fetch(`/investment-tech-tree/api/simulation?years=${selectedYears}&topic=${topic}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch simulation data');
        }
        
        const data = await response.json();
        setSimulationData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching simulation:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimulation();
  }, [selectedYears, topic]); // Re-fetch when topic changes

  // Transform impact data for heatmap
  const heatmapData = useMemo(() => {
    if (!simulationData) return { years: [], technologies: [], data: [] };

    const { impactData } = simulationData;
    const allYears = new Set<string>();

    // Collect ALL years from all technologies
    Object.values(impactData).forEach((techData) => {
      Object.keys(techData).forEach((year) => allYears.add(year));
    });

    const sortedYears = Array.from(allYears).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );
    const technologies = Object.keys(impactData);

    // DEBUG: Log the year range
    console.log('Impact Data - Year Range:', {
      firstYear: sortedYears[0],
      lastYear: sortedYears[sortedYears.length - 1],
      totalYears: sortedYears.length,
      selectedYears: selectedYears,
      expectedLastYear: 2026 + parseInt(selectedYears)
    });

    // DEBUG: Check if we have data beyond 2056
    const yearsBeyond2056 = sortedYears.filter(y => parseInt(y) > 2056);
    console.log('Years beyond 2056:', yearsBeyond2056);

    return {
      years: sortedYears,
      technologies,
      data: technologies.map((tech) => ({
        technology: tech,
        yearlyData: sortedYears.map((year) => ({
          year,
          impact: impactData[tech][year] || 0,
        })),
      })),
    };
  }, [simulationData, selectedYears]);

  // Transform status data for timeline
  const timelineData = useMemo(() => {
    if (!simulationData) return { years: [], technologies: [], data: [] };

    const { statusData } = simulationData;
    const allYears = new Set<string>();

    Object.values(statusData).forEach((techData) => {
      Object.keys(techData).forEach((year) => allYears.add(year));
    });

    const sortedYears = Array.from(allYears).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );
    const technologies = Object.keys(statusData);

    return {
      years: sortedYears,
      technologies,
      data: technologies.map((tech) => ({
        technology: tech,
        yearlyData: sortedYears.map((year) => ({
          year,
          status: statusData[tech][year] || 'Pending',
        })),
      })),
    };
  }, [simulationData]);

  // Get color for impact value
  const getImpactColor = (impact: number) => {
    if (impact === 0) return '#f3f4f6';
    if (!simulationData) return '#f3f4f6';

    const maxImpact = Math.max(
      ...Object.values(simulationData.impactData).flatMap((tech) => Object.values(tech)),
    );
    const intensity = Math.min(impact / maxImpact, 1);
    const alpha = 0.1 + intensity * 0.9;
    return `rgba(59, 130, 246, ${alpha})`;
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#3b82f6';
      case 'Pending':
        return '#f59e0b';
      case 'Completed':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const statusColors = {
    Active: '#3b82f6',
    Pending: '#f59e0b',
    Completed: '#10b981'
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!simulationData) return { totalTechs: 0, maxImpact: 0, activeNow: 0 };

    const totalTechs = Object.keys(simulationData.impactData).length;
    const maxImpact = Math.max(
      ...Object.values(simulationData.impactData).flatMap((tech) => Object.values(tech)),
      0 // Add default value in case there's no data
    );

    // Use 2026 as current year
    const currentYear = '2026';
    const activeNow = Object.values(simulationData.statusData).filter(
      (tech) => tech[currentYear] === 'Active',
    ).length;

    return { totalTechs, maxImpact, activeNow };
  }, [simulationData]);

  if (error) {
    return (
      <div className="p-6 bg-white">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error loading simulation</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Investment Simulation Results
        </h2>

        <div className="mb-4">
          <label
            htmlFor="years-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Simulation Time Horizon (Years):
          </label>
          <select
            id="years-select"
            value={selectedYears}
            onChange={(e) => setSelectedYears(e.target.value)}
            disabled={isLoading}
            className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year} years
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Running simulation...</span>
        </div>
      ) : simulationData ? (
        <div className="space-y-8">
          {/* Summary Statistics */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Simulation Summary ({selectedYears} years)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-600">Total Technologies</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {summaryStats.totalTechs}
                </p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-600">Active Technologies</h4>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.activeNow}
                </p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-600">Max Impact (TWh)</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {summaryStats.maxImpact.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Impact Heatmap */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Technology Impact Heatmap (TWh)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Only impact &gt;0.01 TWh are visualized
            </p>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Year headers */}
                <div className="flex">
                  <div className="w-64 p-2 font-medium text-sm text-gray-700">
                    Technology
                  </div>
                  {heatmapData.years.map((year) => (
                    <div
                      key={year}
                      className="w-16 p-2 text-center font-medium text-sm text-gray-700"
                    >
                      {year}
                    </div>
                  ))}
                </div>

                {/* Technology rows */}
                {heatmapData.data.map((tech) => (
                  <div key={tech.technology} className="flex border-t border-gray-200">
                    <div className="w-64 p-2 text-sm text-gray-800 truncate" title={tech.technology}>
                      {tech.technology}
                    </div>
                    {tech.yearlyData.map(({ year, impact }) => (
                      <div
                        key={year}
                        className="w-16 p-2 text-center text-xs border-l border-gray-200"
                        style={{ backgroundColor: getImpactColor(impact) }}
                        title={`${tech.technology} (${year}): ${impact.toFixed(3)} TWh`}
                      >
                        {impact > 0 ? impact.toFixed(2) : ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Technology Status Timeline
            </h3>
            <div className="mb-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: statusColors.Active }}
                ></div>
                <span>Active</span>
              </div>
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: statusColors.Pending }}
                ></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: statusColors.Completed }}
                ></div>
                <span>Completed</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Year headers */}
                <div className="flex">
                  <div className="w-64 p-2 font-medium text-sm text-gray-700">
                    Technology
                  </div>
                  {timelineData.years.map((year) => (
                    <div
                      key={year}
                      className="w-16 p-2 text-center font-medium text-sm text-gray-700"
                    >
                      {year}
                    </div>
                  ))}
                </div>

                {/* Technology rows */}
                {timelineData.data.map((tech) => (
                  <div key={tech.technology} className="flex border-t border-gray-200">
                    <div className="w-64 p-2 text-sm text-gray-800 truncate" title={tech.technology}>
                      {tech.technology}
                    </div>
                    {tech.yearlyData.map(({ year, status }) => (
                      <div
                        key={year}
                        className="w-16 p-1 text-center border-l border-gray-200"
                        title={`${tech.technology} (${year}): ${status}`}
                      >
                        <div
                          className="w-full h-6 rounded"
                          style={{ backgroundColor: getStatusColor(status) }}
                        ></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Simulations;