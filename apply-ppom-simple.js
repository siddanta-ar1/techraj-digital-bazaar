#!/usr/bin/env node

/**
 * PPOM Migration - Direct Execution (No Dependencies)
 * Usage: node apply-ppom-simple.js
 * 
 * Or via npm: npm run migrate:ppom
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local manually (no dotenv needed)
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        throw new Error('.env.local not found');
    }
    
    const env = {};
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    });
    return env;
}

async function runMigration() {
    try {
        console.log('🚀 PPOM Migration - Terminal Direct Execution\n');
        
        // Load environment
        const env = loadEnv();
        const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
        const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!SUPABASE_URL || !SERVICE_KEY) {
            console.error('❌ Missing Supabase credentials in .env.local');
            process.exit(1);
        }
        
        console.log('✅ Environment loaded');
        console.log(`📍 Project: ${SUPABASE_URL.split('/').pop()}\n`);
        
        // Read migration SQL
        const migrationPath = path.join(process.cwd(), 'add-ppom-columns.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        
        console.log('📝 Migration Content:');
        console.log('─'.repeat(60));
        const preview = sql.split('\n').filter(l => !l.startsWith('--')).slice(0, 3).join('\n');
        console.log(preview);
        console.log('  ...(more statements)');
        console.log('─'.repeat(60));
        console.log('');
        
        console.log('⏳ Executing migration...\n');
        
        // Make HTTPS request
        return new Promise((resolve, reject) => {
            const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`);
            
            const payload = JSON.stringify({ sql });
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY,
                },
                timeout: 30000
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => { data += chunk; });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        // Check for RPC function not found (expected on some projects)
                        if (response.message && response.message.includes('execute_sql')) {
                            console.log('📋 Supabase API: execute_sql RPC not available');
                            console.log('   This is OK - use manual method instead\n');
                            showManualInstructions();
                            process.exit(0);
                        }
                        
                        // Check for success indicators
                        if (data.includes('"data"') || res.statusCode === 200 || data.trim() === '[]') {
                            console.log('✅ Migration executed successfully!\n');
                            showVerificationSteps();
                            resolve();
                        } else {
                            console.log('⚠️  Response:', response);
                            showManualInstructions();
                            process.exit(1);
                        }
                    } catch (e) {
                        console.error('Parse error:', e.message);
                        showManualInstructions();
                        process.exit(1);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ Request error:', error.message);
                showManualInstructions();
                process.exit(1);
            });
            
            req.on('timeout', () => {
                req.destroy();
                console.error('❌ Request timeout');
                showManualInstructions();
                process.exit(1);
            });
            
            req.write(payload);
            req.end();
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check .env.local exists');
        console.error('2. Verify SUPABASE_SERVICE_ROLE_KEY is set');
        console.error('3. Check internet connection');
        process.exit(1);
    }
}

function showManualInstructions() {
    console.log('\n📋 Manual Migration Steps:');
    console.log('─'.repeat(60));
    console.log('');
    console.log('Option 1: Supabase Dashboard');
    console.log('  1. Go: https://app.supabase.com');
    console.log('  2. Select your project');
    console.log('  3. SQL Editor → New Query');
    console.log('  4. Copy entire add-ppom-columns.sql');
    console.log('  5. Paste & Click Run');
    console.log('');
    console.log('Option 2: psql (if available)');
    console.log('  psql "<connection-string>" < add-ppom-columns.sql');
    console.log('');
    console.log('─'.repeat(60));
}

function showVerificationSteps() {
    console.log('✅ Verification Steps:');
    console.log('─'.repeat(60));
    console.log('');
    console.log('1. Check database schema:');
    console.log('   Go to Supabase → Table Editor');
    console.log('   Select order_items table');
    console.log('   Look for columns:');
    console.log('     • option_selections ✓');
    console.log('     • combination_id ✓');
    console.log('     • updated_at ✓');
    console.log('');
    console.log('2. Test the fix:');
    console.log('   • Create order with PPOM customizations');
    console.log('   • Go to Admin → Orders');
    console.log('   • View order details');
    console.log('   • PPOM options should display');
    console.log('');
    console.log('─'.repeat(60));
}

runMigration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
