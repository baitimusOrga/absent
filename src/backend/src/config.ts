import packageJson from '../package.json';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PRODUCTION_ORIGINS = ['https://absent.breachmarket.xyz'];

export const DEFAULT_MONGO_URI = 'mongodb://absent:absent@mongo:27017/absent?authSource=admin';
export const DEFAULT_MONGO_DB_NAME = 'absent';

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCsv = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export interface RuntimeMetadata {
  name: string;
  version: string;
}

export interface DatabaseConfig {
  uri: string;
  dbName: string;
}

export interface CorsConfig {
  enabled: boolean;
  allowList: string[];
}

export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  cors: CorsConfig;
  metadata: RuntimeMetadata;
  database: DatabaseConfig;
}

export const loadAppConfig = (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const metadata: RuntimeMetadata = {
    name: process.env.APP_NAME ?? packageJson.name,
    version: process.env.APP_VERSION ?? packageJson.version,
  };

  const configuredOrigins = parseCsv(process.env.CORS_ORIGIN);
  const allowList = nodeEnv === 'production'
    ? (configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_PRODUCTION_ORIGINS)
    : [];

  return {
    nodeEnv,
    host: process.env.HOST ?? DEFAULT_HOST,
    port: parseNumber(process.env.PORT, DEFAULT_PORT),
    cors: {
      enabled: nodeEnv === 'production',
      allowList,
    },
    metadata,
    database: {
      uri: process.env.MONGO_URI ?? DEFAULT_MONGO_URI,
      dbName: process.env.MONGO_DB ?? DEFAULT_MONGO_DB_NAME,
    },
  };
};

export const ensureProcessMetadata = (metadata: RuntimeMetadata) => {
  if (!process.env.APP_NAME) {
    process.env.APP_NAME = metadata.name;
  }

  if (!process.env.APP_VERSION) {
    process.env.APP_VERSION = metadata.version;
  }
};
