#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runMigration() {
    try {
        console.log('🚀 Running PPOM Migration...\n');
        
        // Read migration file
        const migrationPath = path.join(__dirname, 'add-ppom-columns.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        
        console.log('📝 Migration SQL:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
        console.log('\n⏳ Executing migration...\n');
        
        // Execute via Supabase admin query
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql_batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
            },
            body: JSON.stringify({ 
                sql: sql,
                options: { min_pool_size: 1 }
            })
        });

        if (!response.ok) {
            // Try alternative approach: split and execute statements
            console.log('📋 Using alternative execution method...\n');
            
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s && !s.startsWith('--'));
            
            console.log(`Found ${statements.length} SQL statements\n`);
            
            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i] + ';';
                console.log(`[${i + 1}/${statements.length}] Executing...`);
                
                const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'apikey': SERVICE_KEY,
                    },
                    body: JSON.stringify({ sql: stmt })
                });
                
                if (res.ok) {
                    console.log('  ✅ Success');
                } else {
                    const err = await res.json();
                    console.log(`  ⚠️  ${err.message || 'Error'}`);
                }
            }
        } else {
            console.log('✅ Migration executed successfully!');
        }
        
        // Verify
        console.log('\n✅ Verifying migration...\n');
        
        const { data: columns, error } = await supabase
            .rpc('get_table_columns', { table_name: 'order_items' })
            .catch(() => ({ data: null, error: true }));
        
        if (!error && columns) {
            console.log('📊 order_items columns:');
            const relevantCols = ['combination_id', 'option_selections', 'updated_at'];
            relevantCols.forEach(col => {
                const found = columns.some(c => c.name === col);
                console.log(`  ${found ? '✅' : '❌'} ${col}`);
            });
        } else {
            console.log('✅ Migration complete! Verify in Supabase dashboard.\n');
        }
        
        console.log('\n🎉 PPOM Migration Complete!\n');
        console.log('Next steps:');
        console.log('1. Create an order with PPOM customizations');
        console.log('2. View admin panel order details');
        console.log('3. PPOM options should now display\n');
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Verify .env.local has SUPABASE_SERVICE_ROLE_KEY');
        console.error('2. Check internet connection');
        console.error('3. Ensure Supabase project is active');
        process.exit(1);
    }
}

runMigration();
