import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppState } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');
const stateFile = path.join(dataDir, 'raid-state.json');

const defaultState: AppState = {};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await readFile(stateFile, 'utf8');
    return JSON.parse(raw) as AppState;
  } catch (error) {
    return defaultState;
  }
}

export async function saveState(state: AppState): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(stateFile, JSON.stringify(state, null, 2), 'utf8');
}
