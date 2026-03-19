import { config as loadEnv } from 'dotenv';
import * as path from 'path';

// Load Selenium-specific env file (keeps repo root clean).
loadEnv({ path: path.resolve(__dirname, '.env') });

export const seleniumConfig = {
  baseUrl: process.env['BASE_URL'] ?? 'http://localhost:4200',
  browser: (process.env['SELENIUM_BROWSER'] ?? 'chrome').toLowerCase(),
  headless: (process.env['HEADLESS'] ?? 'true').toLowerCase() !== 'false',
  implicitWaitMs: Number(process.env['IMPLICIT_WAIT_MS'] ?? 0),
  defaultTimeoutMs: Number(process.env['DEFAULT_TIMEOUT_MS'] ?? 10000),
};
