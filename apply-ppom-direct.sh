#!/bin/bash

# Direct PPOM Migration via Supabase API using curl
# No dependencies needed!

echo "🚀 Applying PPOM Migration..."
echo ""

# Load environment
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    exit 1
fi

# Extract credentials
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2-)
SERVICE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2-)

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Missing Supabase credentials"
    exit 1
fi

echo "✅ Credentials loaded"
echo "📍 URL: ${SUPABASE_URL:0:30}..."
echo ""

# Read migration SQL
if [ ! -f add-ppom-columns.sql ]; then
    echo "❌ Migration file not found: add-ppom-columns.sql"
    exit 1
fi

echo "📝 Reading migration SQL..."
SQL=$(cat add-ppom-columns.sql)

# Extract just the migration statements (remove comments)
CLEAN_SQL=$(echo "$SQL" | grep -v "^--" | tr '\n' ' ')

echo "⏳ Executing migration..."
echo ""

# Try direct RPC call
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "apikey: ${SERVICE_KEY}" \
  -d "{\"sql\": \"${CLEAN_SQL}\"}" 2>&1)

# Check response
if echo "$RESPONSE" | grep -q "error" || echo "$RESPONSE" | grep -q "Code"; then
    echo "⚠️  Direct RPC approach not working for this project"
    echo ""
    echo "📋 Alternative: Using psql via SSH tunnel"
    echo ""
    
    # Alternative: Try to use psql if available
    if command -v psql &> /dev/null; then
        echo "🔗 Connecting to Supabase PostgreSQL..."
        
        # Get connection string from Supabase dashboard or use project URL
        # Format: postgresql://user:password@host:5432/database
        echo ""
        echo "To connect directly, you need the PostgreSQL connection string."
        echo "Available from: https://app.supabase.com → Your Project → Settings → Database → Connection Pooling"
        echo ""
        echo "Then run:"
        echo "  psql '<connection-string>' < add-ppom-columns.sql"
    fi
    
    exit 1
else
    echo "✅ Migration successful!"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "🎉 Done! PPOM migration applied."
echo ""
echo "Next steps:"
echo "1. Test by creating an order with PPOM customizations"
echo "2. View order in admin panel"
echo "3. PPOM options should display as [key: value] badges"
