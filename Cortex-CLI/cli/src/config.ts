import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';

// Load config from local .env or home directory ~/.cortex-cli/.env
const homeConfig = path.join(os.homedir(), '.cortex-cli', '.env');

if (existsSync('.env')) {
  dotenv.config();
} else if (existsSync(homeConfig)) {
  dotenv.config({ path: homeConfig });
} else {
  dotenv.config(); // Fallback
}

export const CONFIG_LOADED = true;
