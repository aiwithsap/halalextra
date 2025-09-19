import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 DATABASE_URL missing in production - checking for Railway PostgreSQL variables...');
    
    // Try to construct DATABASE_URL from Railway PostgreSQL variables
    const pgHost = process.env.PGHOST;
    const pgUser = process.env.PGUSER;
    const pgPassword = process.env.PGPASSWORD;
    const pgDatabase = process.env.PGDATABASE;
    const pgPort = process.env.PGPORT || '5432';
    
    if (pgHost && pgUser && pgPassword && pgDatabase) {
      process.env.DATABASE_URL = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
      console.log('✅ Constructed DATABASE_URL from Railway PostgreSQL variables');
    } else {
      console.error('❌ Railway PostgreSQL variables missing:', {
        PGHOST: !!pgHost,
        PGUSER: !!pgUser, 
        PGPASSWORD: !!pgPassword,
        PGDATABASE: !!pgDatabase
      });
      throw new Error(
        "DATABASE_URL must be set in production. Railway PostgreSQL service may not be properly connected.",
      );
    }
  } else {
    console.warn('⚠️ DATABASE_URL not set - using development fallback');
    // Use a development fallback or mock
    process.env.DATABASE_URL = 'postgresql://dev:dev@localhost:5432/halalextra_dev';
  }
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });