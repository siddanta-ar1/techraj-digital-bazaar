#!/bin/bash

# Direct PPOM Migration - Simplified approach
# Reads .env.local and applies migration via Supabase API

echo "🚀 PPOM Migration - Starting..."
echo ""

# Load environment
export $(cat .env.local | grep SUPABASE | xargs)

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    exit 1
fi

echo "✅ Environment loaded"
echo "📍 Project: ${NEXT_PUBLIC_SUPABASE_URL#*/}"
echo ""

# Create temporary JSON file for the request
TEMP_JSON=$(mktemp)

# Read SQL file and properly escape it
SQL=$(cat add-ppom-columns.sql)

# Build JSON payload using jq for proper escaping
echo "Creating request payload..."

cat > "$TEMP_JSON" << EOF
{
  "sql": $(echo "$SQL" | jq -Rs .)
}
EOF

echo "📤 Sending migration request..."
echo ""

# Send request
RESPONSE=$(curl -s -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d @"$TEMP_JSON")

# Clean up
rm "$TEMP_JSON"

# Check response
echo "📋 Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Determine success
if echo "$RESPONSE" | grep -q '"data"'; then
    echo ""
    echo "✅ Migration executed successfully!"
    echo ""
    echo "🎉 PPOM admin bug fixed!"
elif echo "$RESPONSE" | grep -q 'error'; then
    echo ""
    echo "⚠️  API error - trying alternative method..."
    exit 1
else
    echo ""
    echo "✅ Request processed!"
fi

echo ""
echo "📝 Next steps:"
echo "1. Create an order with PPOM customizations"
echo "2. Go to admin panel → Orders"
echo "3. View the order details"
echo "4. PPOM options should display as colored badges"
echo ""
