import 'dotenv/config';
import { createApp } from './app';
import packageJson from '../package.json';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

// Ensure the metadata is set even when running with bare environment files.
process.env.APP_VERSION = process.env.APP_VERSION ?? packageJson.version;
process.env.APP_NAME = process.env.APP_NAME ?? packageJson.name;

const app = createApp();

app.listen(port, host, () => {
  console.log(`API listening on http://${host}:${port}`);
});
