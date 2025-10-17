import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * API Route: POST /api/simulate
 *
 * Executes the Python NuclearScheduler CLI and returns simulation results.
 *
 * Request body:
 * {
 *   "graphData": { nodes: [...], edges: [...] },
 *   "yearsToSimulate": number (default: 20)
 * }
 *
 * Response:
 * {
 *   "impactData": { [techLabel: string]: { [year: number]: number } },
 *   "statusData": { [techLabel: string]: { [year: number]: string } }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { graphData, yearsToSimulate = 20 } = await request.json();

    if (!graphData || !graphData.nodes || !graphData.edges) {
      return NextResponse.json(
        { error: 'Invalid graph data. Expected {nodes, edges}' },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'tmp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Write graph data to temporary file
    const graphInputPath = join(tempDir, 'graph-input.json');
    const resultsOutputPath = join(tempDir, 'results-output.json');

    writeFileSync(graphInputPath, JSON.stringify(graphData, null, 2));

    // Execute the Python CLI using uv run to ensure correct environment
    // The nuclear-scheduler command is defined in pyproject.toml [project.scripts]
    const command = `uv run nuclear-scheduler --graph "${graphInputPath}" --years ${yearsToSimulate} --out "${resultsOutputPath}"`;

    console.log('Executing:', command);

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 60000, // 60 second timeout
    });

    if (stderr) {
      console.warn('Python CLI stderr:', stderr);
    }

    if (stdout) {
      console.log('Python CLI stdout:', stdout);
    }

    // Read the results
    if (!existsSync(resultsOutputPath)) {
      throw new Error('Python CLI did not produce output file');
    }

    const results = JSON.parse(readFileSync(resultsOutputPath, 'utf-8'));

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Simulation error:', error);

    return NextResponse.json(
      {
        error: 'Simulation failed',
        message: error.message,
        details: error.stderr || error.stdout || String(error)
      },
      { status: 500 }
    );
  }
}
