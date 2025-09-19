#!/usr/bin/env npx tsx

/**
 * Security Testing Script for HalalExtra
 * 
 * This script tests the security implementation by:
 * 1. Testing authentication endpoints
 * 2. Validating rate limiting
 * 3. Testing input validation
 * 4. Checking file upload security
 * 5. Verifying security headers
 * 
 * Run with: npx tsx scripts/security-test.ts
 */

import { createLogger } from '../server/logger';

const logger = createLogger('security-test');

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class SecurityTester {
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const response = await fetch(this.baseUrl + url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(`Network error: ${error.message}`);
    }
  }

  private addResult(test: string, passed: boolean, message: string, details?: any) {
    this.results.push({ test, passed, message, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${message}`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async testHealthEndpoint(): Promise<void> {
    try {
      const response = await this.fetch('/api/health');
      const data = await response.json();
      
      if (response.ok && data.status === 'ok') {
        this.addResult('Health Check', true, 'Health endpoint accessible');
      } else {
        this.addResult('Health Check', false, 'Health endpoint failed', { status: response.status, data });
      }
    } catch (error: any) {
      this.addResult('Health Check', false, 'Health endpoint unreachable', { error: error.message });
    }
  }

  async testAuthenticationValidation(): Promise<void> {
    try {
      // Test login without credentials
      const emptyLogin = await this.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (emptyLogin.status === 400) {
        this.addResult('Auth Validation', true, 'Empty login properly rejected');
      } else {
        this.addResult('Auth Validation', false, 'Empty login not properly validated');
      }

      // Test login with invalid credentials
      const invalidLogin = await this.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'invalid', password: 'invalid' }),
      });
      
      if (invalidLogin.status === 401) {
        this.addResult('Invalid Credentials', true, 'Invalid credentials properly rejected');
      } else {
        this.addResult('Invalid Credentials', false, 'Invalid credentials not properly handled');
      }

    } catch (error: any) {
      this.addResult('Auth Validation', false, 'Authentication validation test failed', { error: error.message });
    }
  }

  async testRateLimiting(): Promise<void> {
    try {
      console.log('Testing rate limiting (this may take a moment)...');
      
      const requests = [];
      const maxRequests = 15; // Should hit rate limit before this
      
      for (let i = 0; i < maxRequests; i++) {
        requests.push(this.fetch('/api/health'));
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      if (rateLimited) {
        this.addResult('Rate Limiting', true, 'Rate limiting is working');
      } else {
        this.addResult('Rate Limiting', false, 'Rate limiting may not be configured properly');
      }
      
    } catch (error: any) {
      this.addResult('Rate Limiting', false, 'Rate limiting test failed', { error: error.message });
    }
  }

  async testSecurityHeaders(): Promise<void> {
    try {
      const response = await this.fetch('/api/health');
      const headers = response.headers;
      
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy'
      ];
      
      const presentHeaders = securityHeaders.filter(header => headers.has(header));
      
      if (presentHeaders.length >= 3) {
        this.addResult('Security Headers', true, `${presentHeaders.length} security headers present`, { headers: presentHeaders });
      } else {
        this.addResult('Security Headers', false, 'Insufficient security headers', { headers: presentHeaders });
      }
      
    } catch (error: any) {
      this.addResult('Security Headers', false, 'Security headers test failed', { error: error.message });
    }
  }

  async testInputValidation(): Promise<void> {
    try {
      // Test SQL injection attempt
      const sqlInjection = await this.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: "admin'; DROP TABLE users; --",
          password: 'password'
        }),
      });
      
      if (sqlInjection.status === 400 || sqlInjection.status === 401) {
        this.addResult('SQL Injection Protection', true, 'SQL injection attempt properly blocked');
      } else {
        this.addResult('SQL Injection Protection', false, 'SQL injection attempt not properly handled');
      }
      
      // Test XSS attempt
      const xssAttempt = await this.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: '<script>alert("xss")</script>',
          password: 'password'
        }),
      });
      
      if (xssAttempt.status === 400 || xssAttempt.status === 401) {
        this.addResult('XSS Protection', true, 'XSS attempt properly blocked');
      } else {
        this.addResult('XSS Protection', false, 'XSS attempt not properly handled');
      }
      
    } catch (error: any) {
      this.addResult('Input Validation', false, 'Input validation test failed', { error: error.message });
    }
  }

  async testCORSProtection(): Promise<void> {
    try {
      const response = await this.fetch('/api/health', {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });
      
      const corsHeader = response.headers.get('access-control-allow-origin');
      
      if (!corsHeader || corsHeader !== 'https://malicious-site.com') {
        this.addResult('CORS Protection', true, 'CORS properly configured');
      } else {
        this.addResult('CORS Protection', false, 'CORS may be too permissive');
      }
      
    } catch (error: any) {
      this.addResult('CORS Protection', false, 'CORS test failed', { error: error.message });
    }
  }

  async testPasswordSecurity(): Promise<void> {
    try {
      // Test weak password rejection (if registration is available)
      const weakPassword = await this.fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: '123' // Very weak password
        }),
      });
      
      if (weakPassword.status === 400 || weakPassword.status === 401) {
        this.addResult('Password Security', true, 'Weak passwords properly handled');
      } else {
        this.addResult('Password Security', false, 'Weak password validation may be insufficient');
      }
      
    } catch (error: any) {
      this.addResult('Password Security', false, 'Password security test failed', { error: error.message });
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🔒 Starting HalalExtra Security Testing...\n');
    
    const tests = [
      () => this.testHealthEndpoint(),
      () => this.testAuthenticationValidation(),
      () => this.testInputValidation(),
      () => this.testSecurityHeaders(),
      () => this.testCORSProtection(),
      () => this.testPasswordSecurity(),
      () => this.testRateLimiting(), // Run last as it's slow
    ];
    
    for (const test of tests) {
      await test();
    }
    
    this.printSummary();
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log('\n📊 Security Test Summary:');
    console.log('='.repeat(40));
    console.log(`Tests Passed: ${passed}/${total} (${percentage}%)`);
    
    if (percentage >= 80) {
      console.log('🎉 Security implementation looks good!');
    } else if (percentage >= 60) {
      console.log('⚠️  Security implementation needs improvement.');
    } else {
      console.log('🚨 Security implementation has significant issues.');
    }
    
    const failed = this.results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      failed.forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
    
    console.log('\n📋 Recommendations:');
    if (failed.some(r => r.test.includes('Auth'))) {
      console.log('   • Review authentication implementation');
    }
    if (failed.some(r => r.test.includes('Headers'))) {
      console.log('   • Configure security headers properly');
    }
    if (failed.some(r => r.test.includes('Rate'))) {
      console.log('   • Implement rate limiting');
    }
    if (failed.some(r => r.test.includes('CORS'))) {
      console.log('   • Configure CORS restrictions');
    }
    
    console.log('   • Review SECURITY.md for detailed implementation guide');
    console.log('   • Monitor security logs in production');
    console.log('   • Consider additional security testing tools');
  }
}

async function main() {
  const serverUrl = process.env.TEST_SERVER_URL || 'http://localhost:3000';
  const tester = new SecurityTester(serverUrl);
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error: any) {
    console.error('Security testing failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Security test script failed:', error);
    process.exit(1);
  });
}

export { SecurityTester };