#!/bin/bash

# PPOM Migration - Direct Terminal Execution
# This script applies the PPOM database migration using available tools

set -e

echo "🚀 PPOM Migration - Terminal Execution"
echo "======================================"
echo ""

# Check environment
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    exit 1
fi

echo "✅ Found Supabase credentials"
echo "📍 Project: $SUPABASE_URL"
echo ""

# Method 1: Try using curl with SQL execution
echo "📡 Applying migration via Supabase API..."
echo ""

SQL=$(cat add-ppom-columns.sql)

# Execute using curl
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "apikey: ${SERVICE_KEY}" \
  -d "{\"sql\": $(echo "$SQL" | jq -Rs .)}")

echo "📋 Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q "error"; then
    echo ""
    echo "⚠️  API method failed. Trying Node.js approach..."
    echo ""
    node apply-ppom-migration.js
else
    echo ""
    echo "✅ Migration applied via API!"
fi
