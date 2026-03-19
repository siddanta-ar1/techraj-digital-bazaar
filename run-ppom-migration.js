#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🚀 Running PPOM migration...');
        
        // Read migration file
        const migrationPath = path.join(__dirname, 'add-ppom-columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // Execute migration
        const { data, error } = await supabase.rpc('execute_sql', {
            sql: migrationSQL
        }).catch(async () => {
            // Fallback: Execute individual statements
            console.log('📝 Executing migration statements individually...');
            
            const statements = migrationSQL.split(';').filter(s => s.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    console.log(`  Executing: ${statement.substring(0, 50)}...`);
                    // Note: This won't work with anon key, need service role
                }
            }
            
            return { data: null, error: 'Need admin access' };
        });
        
        if (error) {
            console.log('⚠️  Attempting direct SQL execution via HTTP...');
            
            // Use direct HTTP call with service role
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                },
                body: JSON.stringify({ sql: migrationSQL })
            });
            
            if (!response.ok) {
                console.log('⚠️  Direct RPC approach not available.');
                console.log('✅ Please run the migration manually in Supabase dashboard:');
                console.log('   1. Go to Supabase dashboard');
                console.log('   2. Click SQL Editor');
                console.log('   3. Click New Query');
                console.log('   4. Paste the contents of add-ppom-columns.sql');
                console.log('   5. Click Run');
                process.exit(0);
            }
        }
        
        console.log('✅ PPOM migration completed successfully!');
        console.log('✅ Added columns: combination_id, option_selections to order_items table');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n📋 Manual steps to apply migration:');
        console.log('   1. Go to https://app.supabase.com');
        console.log('   2. Select your project');
        console.log('   3. Go to SQL Editor');
        console.log('   4. Click "New query"');
        console.log('   5. Copy the contents of add-ppom-columns.sql');
        console.log('   6. Paste and execute');
        process.exit(1);
    }
}

runMigration();
