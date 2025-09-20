import { createLogger } from '../server/logger';
import { createDefaultAdminUser } from '../server/auth';

const logger = createLogger('fix-database');

async function fixDatabase() {
  try {
    logger.info('🔧 Starting database fix...');
    
    // Check if we can create default admin user
    await createDefaultAdminUser();
    
    logger.info('✅ Database fix completed successfully');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Database fix failed:', { error: error.message });
    
    if (error.message.includes('ECONNREFUSED')) {
      logger.error('💥 Database connection refused - PostgreSQL service unreachable');
      logger.error('Check Railway PostgreSQL service status and DATABASE_URL');
    }
    
    process.exit(1);
  }
}

fixDatabase();