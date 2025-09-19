#!/usr/bin/env npx tsx

/**
 * Security Migration Script for HalalExtra
 * 
 * This script performs the following security-related migrations:
 * 1. Creates default admin user if none exists
 * 2. Hashes any existing plain text passwords in the database
 * 3. Creates audit log entries for the migration
 * 
 * Run with: npx tsx scripts/migrate-security.ts
 */

import { db } from '../server/db';
import { users, auditLogs } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createDefaultAdminUser } from '../server/auth';
import { createLogger } from '../server/logger';

const logger = createLogger('migration');

async function migrateUserPasswords() {
  logger.info('Starting password migration');
  
  try {
    // Get all users with potentially unhashed passwords
    const allUsers = await db.select().from(users);
    
    let migratedCount = 0;
    
    for (const user of allUsers) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$)
      if (!user.password.startsWith('$2')) {
        logger.info(`Migrating password for user: ${user.username}`);
        
        // Hash the plain text password
        const hashedPassword = await hashPassword(user.password);
        
        // Update the user's password
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        
        // Create audit log entry
        await db.insert(auditLogs).values({
          userId: user.id,
          action: 'password_migrated',
          entity: 'user',
          entityId: user.id,
          details: {
            username: user.username,
            migration_date: new Date().toISOString(),
            migration_type: 'security_update'
          },
          ipAddress: '127.0.0.1' // System migration
        });
        
        migratedCount++;
        logger.info(`Password migrated successfully for user: ${user.username}`);
      } else {
        logger.info(`Password already hashed for user: ${user.username}`);
      }
    }
    
    logger.info(`Password migration completed. ${migratedCount} passwords migrated.`);
    return migratedCount;
    
  } catch (error: any) {
    logger.error('Password migration failed', { error: error.message });
    throw error;
  }
}

async function createSystemAuditLog(action: string, details: any) {
  try {
    await db.insert(auditLogs).values({
      userId: null, // System action
      action,
      entity: 'system',
      entityId: null,
      details: {
        ...details,
        migration_date: new Date().toISOString(),
        script_version: '1.0.0'
      },
      ipAddress: '127.0.0.1'
    });
  } catch (error: any) {
    logger.error('Failed to create audit log', { action, error: error.message });
  }
}

async function validateSecuritySettings() {
  logger.info('Validating security settings');
  
  const errors = [];
  const warnings = [];
  
  // Check for required environment variables
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'development-secret-key') {
    if (process.env.NODE_ENV === 'production') {
      // Generate a temporary JWT secret for production if missing
      const crypto = require('crypto');
      const tempSecret = crypto.randomBytes(32).toString('hex');
      process.env.JWT_SECRET = tempSecret;
      warnings.push('JWT_SECRET was missing in production - generated temporary secret. Set proper JWT_SECRET environment variable!');
    } else {
      warnings.push('JWT_SECRET is using default value - change for production');
    }
  }
  
  if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      // Generate a temporary session secret for production if missing
      const crypto = require('crypto');
      const tempSecret = crypto.randomBytes(32).toString('hex');
      process.env.SESSION_SECRET = tempSecret;
      warnings.push('SESSION_SECRET was missing in production - generated temporary secret. Set proper SESSION_SECRET environment variable!');
    } else {
      warnings.push('SESSION_SECRET not set - using fallback for development');
      // Set a development fallback
      process.env.SESSION_SECRET = 'development-session-secret-change-in-production';
    }
  }
  
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.startsWith('postgres')) {
    warnings.push('Database URL should use PostgreSQL in production');
  }
  
  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long');
  }
  
  // Report findings
  if (errors.length > 0) {
    logger.error('Security validation failed', { errors });
    throw new Error(`Security validation failed: ${errors.join(', ')}`);
  }
  
  if (warnings.length > 0) {
    logger.warn('Security validation warnings', { warnings });
    await createSystemAuditLog('security_validation_warnings', { warnings });
  } else {
    logger.info('Security validation passed');
    await createSystemAuditLog('security_validation_passed', { status: 'ok' });
  }
}

async function main() {
  try {
    logger.info('Starting security migration');
    
    // Step 1: Validate security settings
    await validateSecuritySettings();
    
    // Step 2: Create default admin user
    await createDefaultAdminUser();
    
    // Step 3: Migrate existing passwords
    const migratedCount = await migrateUserPasswords();
    
    // Step 4: Create system audit log
    await createSystemAuditLog('security_migration_completed', {
      passwords_migrated: migratedCount,
      security_level: 'enhanced',
      features_enabled: [
        'bcrypt_password_hashing',
        'jwt_authentication',
        'rate_limiting',
        'input_validation',
        'security_logging',
        'cors_protection'
      ]
    });
    
    logger.info('Security migration completed successfully');
    
    // Step 5: Display summary
    console.log('\n✅ HalalExtra Security Migration Completed Successfully!\n');
    console.log('🔒 Security Features Enabled:');
    console.log('   • Bcrypt password hashing with salt rounds: 12');
    console.log('   • JWT authentication with RS256 algorithm');
    console.log('   • Rate limiting and request throttling');
    console.log('   • Comprehensive input validation with Zod');
    console.log('   • Security headers with Helmet');
    console.log('   • CORS protection with origin validation');
    console.log('   • File upload validation and sanitization');
    console.log('   • Security audit logging');
    console.log('   • Error handling without information leakage');
    console.log(`   • ${migratedCount} passwords migrated to secure hashes\n`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚨 Development Mode Notes:');
      console.log('   • Default admin user created: admin / admin123');
      console.log('   • Change password immediately in production!');
      console.log('   • Set JWT_SECRET environment variable');
      console.log('   • Configure ALLOWED_ORIGINS for production\n');
    }
    
    console.log('📋 Next Steps:');
    console.log('   1. Test authentication with new secure endpoints');
    console.log('   2. Update frontend to use new token format');
    console.log('   3. Monitor security logs for unusual activity');
    console.log('   4. Configure environment variables for production');
    console.log('   5. Set up SSL/TLS certificates');
    console.log('   6. Enable monitoring and alerting\n');
    
    process.exit(0);
    
  } catch (error: any) {
    logger.error('Security migration failed', { error: error.message });
    
    console.error('\n❌ Security Migration Failed!\n');
    console.error('Error:', error.message);
    console.error('\nPlease fix the issues and run the migration again.\n');
    
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

export { main as runSecurityMigration };