import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnvFile } from 'dotenv';

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required to generate the frontend config.`);
  }
  return value;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const envCandidates = [];

if (process.env.FRONTEND_ENV_FILE) {
  envCandidates.push(path.resolve(projectRoot, process.env.FRONTEND_ENV_FILE));
}

if (process.env.NODE_ENV) {
  envCandidates.push(path.resolve(projectRoot, `.env.${process.env.NODE_ENV}`));
}

envCandidates.push(path.resolve(projectRoot, '.env'));

envCandidates.forEach((candidate) => {
  if (existsSync(candidate)) {
    loadEnvFile({ path: candidate, override: false });
  }
});

const nodeEnv = requireEnv('NODE_ENV');
const configPayload = {
  production: nodeEnv.trim().toLowerCase() === 'production',
  appName: requireEnv('APP_NAME'),
  version: requireEnv('APP_VERSION'),
  apiUrl: requireEnv('API_URL'),
};

const outputDirectory = path.resolve(projectRoot, 'public', 'config');
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, 'config.json');
await writeFile(outputPath, JSON.stringify(configPayload, null, 2), 'utf8');

console.info(`Generated frontend config at ${path.relative(projectRoot, outputPath)}`);