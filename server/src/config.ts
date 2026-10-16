import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server dir or root dir
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/stackpulse',
  githubToken: process.env.GITHUB_TOKEN || '',
  jwtSecret: process.env.JWT_SECRET || 'stackpulse-super-secret-jwt-key-2026',
  cacheTtlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '60', 10),
};
