import { TechTree } from './types';

// Model Configuration & Assumptions
const DISCOUNT_RATE = 0.05;
const YEARS_OF_OPERATION = 60;
const AVG_PLANT_CAPACITY_MW = 1000;
const CAPACITY_FACTOR = 0.90;
const CURRENT_YEAR = new Date().getFullYear();
const MWH_TO_TWH = 1_000_000;

const TRL_PROBABILITY_MAP: Record<string, number> = {
  "1": 0.10, "2": 0.20, "2-3": 0.25, "3": 0.30, "3-4": 0.40,
  "4": 0.50, "4-5": 0.60, "5": 0.70, "5-6": 0.75, "6": 0.80,
  "6-7": 0.85, "7": 0.90, "7-8": 0.95, "8": 0.98, "9": 1.0,
  "default": 0.6
};

interface SimulationNode {
  id: string;
  label: string;
  type: string;
  initial_time: number;
  time_remaining: number;
  prob_of_success: number;
  is_complete: boolean;
  trl_current?: string;
  trl_projected_5_10_years?: string;
}

interface SimulationResults {
  impactData: Record<string, Record<number, number>>;
  statusData: Record<string, Record<number, string>>;
}

export class NuclearScheduler {
  private nodes: Record<string, any>;
  private edges: any[];
  private dependencies: Record<string, string[]>;
  private successors: Record<string, string[]>;
  private memoizationCache: Record<string, [number, number]> = {};
  private recursionStack: Set<string> = new Set();

  constructor(techTree: TechTree) {
    this.nodes = {};
    techTree.nodes.forEach(node => {
      this.nodes[node.id] = {
        id: node.id,
        type: node.data.nodeLabel,
        ...node.data
      };
    });
    
    this.edges = techTree.edges;
    this.dependencies = this.buildDependencyMap();
    this.successors = this.buildSuccessorMap();
  }

  private buildDependencyMap(): Record<string, string[]> {
    const deps: Record<string, string[]> = {};
    Object.keys(this.nodes).forEach(nodeId => {
      deps[nodeId] = [];
    });

    this.edges.forEach(edge => {
      if (edge.target && deps[edge.target]) {
        deps[edge.target].push(edge.source);
      }
    });

    return deps;
  }

  private buildSuccessorMap(): Record<string, string[]> {
    const succ: Record<string, string[]> = {};
    Object.keys(this.nodes).forEach(nodeId => {
      succ[nodeId] = [];
    });

    this.edges.forEach(edge => {
      if (edge.source && succ[edge.source]) {
        succ[edge.source].push(edge.target);
      }
    });

    return succ;
  }

  private getDownstreamConcepts(startNodeId: string): string[] {
    const concepts = new Set<string>();
    const queue = [startNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const node = this.nodes[currId];
      if (node && node.type === 'ReactorConcept') {
        concepts.add(currId);
      }

      const successors = this.successors[currId] || [];
      successors.forEach(succId => {
        if (!visited.has(succId)) {
          queue.push(succId);
        }
      });
    }

    return Array.from(concepts);
  }

  private getInitialProb(node: any): number {
    let trlStr = node.trl_current || 'default';
    if (trlStr.includes(' ')) trlStr = trlStr.split(' ')[0];
    if (trlStr.includes(';')) trlStr = trlStr.split(';')[0].trim();
    return TRL_PROBABILITY_MAP[trlStr] || TRL_PROBABILITY_MAP['default'];
  }

  private findCriticalPath(nodeId: string, currentNodes: Record<string, SimulationNode>): [number, number] {
    if (this.recursionStack.has(nodeId)) return [Infinity, 0.0];
    if (this.memoizationCache[nodeId]) return this.memoizationCache[nodeId];

    const node = currentNodes[nodeId];
    if (!node) return [0, 1.0];

    this.recursionStack.add(nodeId);

    const timeForThisNode = node.time_remaining || 0;
    const probOfThisNode = node.prob_of_success || 1.0;

    const prereqIds = this.dependencies[nodeId] || [];
    if (prereqIds.length === 0) {
      this.recursionStack.delete(nodeId);
      return [timeForThisNode, probOfThisNode];
    }

    const prereqTimes: number[] = [];
    const prereqProbs: number[] = [];
    
    prereqIds.forEach(prereqId => {
      const [prereqTime, prereqProb] = this.findCriticalPath(prereqId, currentNodes);
      prereqTimes.push(prereqTime);
      prereqProbs.push(prereqProb);
    });

    const maxPrereqTime = prereqTimes.length > 0 ? Math.max(...prereqTimes) : 0.0;
    const combinedPrereqProb = prereqProbs.reduce((acc, prob) => acc * prob, 1);

    const totalTime = timeForThisNode + maxPrereqTime;
    const totalProb = probOfThisNode * combinedPrereqProb;

    this.recursionStack.delete(nodeId);
    this.memoizationCache[nodeId] = [totalTime, totalProb];
    return [totalTime, totalProb];
  }

  private calculateDiscountedMwh(deploymentYear: number): number {
    if (deploymentYear === Infinity) return 0;
    const annualMwh = AVG_PLANT_CAPACITY_MW * CAPACITY_FACTOR * 24 * 365;
    let totalDiscountedMwh = 0;
    
    for (let i = 0; i < YEARS_OF_OPERATION; i++) {
      const year = deploymentYear + i;
      if (year > CURRENT_YEAR) {
        totalDiscountedMwh += annualMwh / Math.pow(1 + DISCOUNT_RATE, year - CURRENT_YEAR);
      }
    }
    
    return totalDiscountedMwh;
  }

  private calculatePathwayMwh(nodesToSim: Record<string, SimulationNode>, conceptIds: string[]): number {
    this.memoizationCache = {};
    let totalExpectedMwh = 0;
    
    conceptIds.forEach(conceptId => {
      const [timeToDeploy, probOfSuccess] = this.findCriticalPath(conceptId, nodesToSim);
      const deploymentYear = CURRENT_YEAR + timeToDeploy;
      const potentialMwh = this.calculateDiscountedMwh(deploymentYear);
      totalExpectedMwh += potentialMwh * probOfSuccess;
    });
    
    return totalExpectedMwh;
  }

  runSimulation(yearsToSimulate: number = 20): SimulationResults {
    const simNodes: Record<string, SimulationNode> = {};
    
    // Initialize simulation nodes
    Object.entries(this.nodes).forEach(([nodeId, node]) => {
      let initialTime = 0;

      if (node.trl_projected_5_10_years) {
        initialTime = 7.5;
      } else {
        try {
          const trlVal = parseFloat((node.trl_current || '1').split('-')[0].split(' ')[0]);
          initialTime = (9 - trlVal) * 2.5;
        } catch {
          initialTime = 5.0;
        }
      }

      simNodes[nodeId] = {
        id: nodeId,
        label: node.label,
        type: node.type,
        initial_time: initialTime > 0 ? initialTime : 0.1,
        time_remaining: initialTime,
        prob_of_success: this.getInitialProb(node),
        is_complete: initialTime <= 0
      };
    });

    const impactTable: Record<string, Record<number, number>> = {};
    const statusTable: Record<string, Record<number, string>> = {};

    // Initialize tables for milestones and enabling technologies
    Object.values(this.nodes).forEach(node => {
      if (['Milestone', 'EnablingTechnology'].includes(node.type)) {
        impactTable[node.label] = {};
        statusTable[node.label] = {};
      }
    });

    // Run simulation year by year
    for (let year = CURRENT_YEAR; year < CURRENT_YEAR + yearsToSimulate; year++) {
      // Update node status and progress
      Object.entries(simNodes).forEach(([nodeId, node]) => {
        if (!['Milestone', 'EnablingTechnology'].includes(node.type)) return;

        const prereqs = this.dependencies[nodeId] || [];
        const isActive = prereqs.every(pid => simNodes[pid].is_complete);

        if (node.is_complete) {
          statusTable[node.label][year] = "Completed";
          return;
        }

        if (isActive) {
          statusTable[node.label][year] = "Active";
          if (node.time_remaining > 0) {
            node.time_remaining -= 1;
            const riskReductionPerYear = (1 - this.getInitialProb(this.nodes[nodeId])) / node.initial_time;
            node.prob_of_success += riskReductionPerYear;
          }
          if (node.time_remaining <= 0) {
            node.is_complete = true;
            node.prob_of_success = 1.0;
          }
        } else {
          statusTable[node.label][year] = "Pending";
        }
      });

      // Calculate impact for active nodes
      Object.entries(simNodes).forEach(([nodeId, node]) => {
        if (!['Milestone', 'EnablingTechnology'].includes(node.type)) return;
        if (node.is_complete) return;
        if (statusTable[node.label][year] !== "Active") return;

        // Find affected concepts
        const affectedConcepts = this.getDownstreamConcepts(nodeId);
        if (affectedConcepts.length === 0) return;

        // Calculate baseline MWh
        const baselineMwh = this.calculatePathwayMwh(simNodes, affectedConcepts);

        // Create temporary accelerated scenario
        const tempNodes = JSON.parse(JSON.stringify(simNodes));
        tempNodes[nodeId].time_remaining -= 1;
        const riskReductionPerYear = (1 - this.getInitialProb(this.nodes[nodeId])) / tempNodes[nodeId].initial_time;
        tempNodes[nodeId].prob_of_success += riskReductionPerYear;

        // Calculate accelerated MWh
        const acceleratedMwh = this.calculatePathwayMwh(tempNodes, affectedConcepts);

        const impactTwh = (acceleratedMwh - baselineMwh) / MWH_TO_TWH;
        if (impactTwh > 0.001) {
          impactTable[node.label][year] = impactTwh;
        }
      });
    }

    return {
      impactData: impactTable,
      statusData: statusTable
    };
  }
}

export function calculateSummaryStats(impactData: Record<string, Record<number, number>>) {
  const totalTechs = Object.keys(impactData).length;
  const activeTechs = Object.values(impactData).filter(techData => 
    Object.values(techData).some(impact => impact > 0)
  ).length;
  
  const maxImpact = Math.max(
    ...Object.values(impactData).map(yearlyImpacts => 
      Object.values(yearlyImpacts).length > 0 ? Math.max(...Object.values(yearlyImpacts)) : 0
    )
  );
  
  const currentYear = new Date().getFullYear();
  const currentOpportunities = Object.values(impactData).filter(techData => 
    (techData[currentYear] || 0) > 0
  ).length;

  return {
    totalTechs,
    activeTechs,
    maxImpact,
    currentOpportunities
  };
}

// Add this utility function to the nuclear scheduler
export function convertDataToTechTree(data: any): any {
  return {
    graph: {
      nodes: data.nodes.map((node: any) => ({
        id: node.id,
        label: node.data.label,
        type: node.data.nodeLabel,
        ...node.data
      })),
      edges: data.edges
    }
  };
}