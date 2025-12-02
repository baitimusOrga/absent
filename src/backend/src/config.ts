const parseNumber = (value: string, key: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a number. Received "${value}".`);
  }

  return parsed;
};

const parseCsv = (value: string | undefined): string[] =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0) ?? [];

const parseBoolean = (value: string, key: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error(`Environment variable ${key} must be either "true" or "false". Received "${value}".`);
  }

  return normalized === 'true';
};

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}.`);
  }

  return value;
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
  const nodeEnv = requireEnv('NODE_ENV');
  const corsEnabled = parseBoolean(requireEnv('CORS_ENABLED'), 'CORS_ENABLED');
  const allowList = parseCsv(process.env.CORS_ORIGIN);

  if (corsEnabled && allowList.length === 0) {
    throw new Error('CORS_ORIGIN must contain at least one entry when CORS_ENABLED is true.');
  }

  return {
    nodeEnv,
    host: requireEnv('HOST'),
    port: parseNumber(requireEnv('PORT'), 'PORT'),
    cors: {
      enabled: corsEnabled,
      allowList,
    },
    metadata: {
      name: requireEnv('APP_NAME'),
      version: requireEnv('APP_VERSION'),
    },
    database: {
      uri: requireEnv('MONGO_URI'),
      dbName: requireEnv('MONGO_DB'),
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
