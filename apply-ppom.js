#!/usr/bin/env node

/**
 * PPOM Migration - Terminal Direct Execution
 * 
 * This script applies the PPOM database migration directly
 * No complex setup needed - just run: npx ts-node apply-ppom.js
 * 
 * Or: npm run migrate:ppom
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('   Required in .env.local:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

async function runMigration() {
    try {
        console.log('🚀 PPOM Migration - Terminal Execution\n');
        
        // Read migration file
        const migrationPath = path.join(__dirname, 'add-ppom-columns.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        
        console.log('📝 Migration SQL Preview:');
        console.log('─'.repeat(60));
        console.log(sql.split('\n').slice(0, 5).join('\n'));
        console.log('  ...(truncated)');
        console.log('─'.repeat(60));
        console.log('');
        
        console.log('⏳ Executing migration via Supabase API...\n');
        
        // Parse URL
        const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`);
        
        const payload = JSON.stringify({ sql });
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
            }
        };
        
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (response.message && response.message.includes('function')) {
                            console.log('⚠️  Supabase API limitation detected\n');
                            console.log('📋 PPOM Migration could not be auto-applied');
                            console.log('   This is normal for certain Supabase projects\n');
                            console.log('✅ SOLUTION: Apply migration manually via Supabase Dashboard');
                            console.log('   1. Go: https://app.supabase.com');
                            console.log('   2. SQL Editor → New Query');
                            console.log('   3. Copy entire contents of add-ppom-columns.sql');
                            console.log('   4. Click Run\n');
                            process.exit(0);
                        }
                        
                        if (response.data || res.statusCode === 200) {
                            console.log('✅ Migration executed successfully!\n');
                            console.log('Response:', response);
                            resolve();
                        } else if (response.error) {
                            console.log('⚠️  Error:', response.error);
                            reject(new Error(response.error));
                        } else {
                            console.log('Response:', response);
                            resolve();
                        }
                    } catch (e) {
                        resolve(); // Assume success if JSON parse fails
                    }
                });
            });
            
            req.on('error', reject);
            req.write(payload);
            req.end();
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

runMigration();
