# 🚀 PPOM Migration - Terminal Execution Options

## Quick Summary

You can apply the PPOM database migration directly from terminal using one of these methods:

---

## ✅ Option 1: Supabase CLI (Recommended - Easiest)

### Install Supabase CLI
```bash
npm install -g supabase
```

### Authenticate
```bash
supabase login
```

### Apply Migration
```bash
supabase db push < add-ppom-columns.sql
```

---

## ✅ Option 2: Terminal Script (Automated)

### Run Migration
```bash
node apply-ppom-simple.js
```

This script:
- ✅ Reads credentials from `.env.local`
- ✅ Loads migration SQL
- ✅ Executes via Supabase API
- ✅ Shows verification steps

**Note**: If your project doesn't have the execute_sql RPC, it will show manual instructions.

---

## ✅ Option 3: psql (PostgreSQL Client)

### Prerequisites
```bash
# Check if psql is installed
which psql

# If not installed on macOS:
brew install postgresql
```

### Get PostgreSQL Connection String

1. Go to https://app.supabase.com
2. Select your project
3. Settings → Database
4. Copy connection string (under "Connection pooling" section)

### Apply Migration via psql
```bash
# Option A: Direct
psql 'postgresql://user:password@host:5432/database' < add-ppom-columns.sql

# Option B: Using environment variable
export DATABASE_URL='postgresql://user:password@host:5432/database'
psql "$DATABASE_URL" < add-ppom-columns.sql

# Option C: Interactive mode
psql
# Then paste migration SQL into prompt
```

---

## ✅ Option 4: curl (Any Terminal)

### Using curl to execute SQL
```bash
curl -X POST \
  'https://YOUR_SUPABASE_URL/rest/v1/sql' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SERVICE_KEY' \
  -d @- << 'EOF'
{
  "sql": "$(cat add-ppom-columns.sql | jq -Rs .)"
}
EOF
```

---

## ✅ Option 5: npm Script (Simplest)

### Run via npm
```bash
npm run migrate:ppom
```

This uses the `apply-ppom-simple.js` script.

---

## 🎯 Recommended Flow

### Best for You (Quick & Easy):
```bash
# 1. Run the simple script
node apply-ppom-simple.js

# 2. If that doesn't work, use Supabase dashboard
#    (It will show instructions)

# 3. Or install Supabase CLI and run:
npm install -g supabase
supabase login
supabase db push < add-ppom-columns.sql
```

---

## 📊 Comparison Table

| Method | Ease | Speed | Dependencies | Reliability |
|--------|------|-------|--------------|-------------|
| Node Script | ⭐⭐⭐⭐⭐ | Fast | Node.js | High |
| Supabase CLI | ⭐⭐⭐⭐ | Medium | CLI | Very High |
| psql | ⭐⭐⭐ | Fast | psql | Very High |
| curl | ⭐⭐ | Fast | curl | Medium |
| Dashboard | ⭐⭐ | Slow | Browser | High |

---

## ✅ Verify Migration Applied

After running migration, verify it worked:

### Via Node (quick)
```bash
node check-migration.js
```

### Via psql
```bash
psql "$DATABASE_URL" -c "\d order_items"
```

### Via Supabase Dashboard
1. Go to Supabase dashboard
2. Table Editor → order_items
3. Look for columns:
   - ✅ `option_selections` (jsonb)
   - ✅ `combination_id` (uuid)
   - ✅ `updated_at` (timestamp)

---

## 🔧 Troubleshooting

### "Command not found: node"
```bash
# Install Node.js or use system node
which node
```

### "Cannot find module"
```bash
# Install dependencies
npm install

# Then run
npm run migrate:ppom
```

### "psql: command not found"
```bash
# Install PostgreSQL client
brew install postgresql  # macOS
apt install postgresql-client  # Linux
choco install postgresql  # Windows
```

### "Connection refused"
- Check internet connection
- Verify Supabase project is active
- Check credentials in `.env.local`

### Migration shows RPC not available
```bash
# This is OK! Use Supabase dashboard instead:
# https://app.supabase.com → SQL Editor → New Query
# Paste add-ppom-columns.sql and click Run
```

---

## 🎉 After Migration

Once migration is applied:

1. ✅ PPOM data will be stored in database
2. ✅ Admin panel will display PPOM options
3. ✅ User dashboard will show customizations
4. ✅ Ready for Phase 2 tests

---

## 📝 Files Available

| File | Purpose |
|------|---------|
| `add-ppom-columns.sql` | SQL migration |
| `apply-ppom-simple.js` | Node.js executor |
| `apply-ppom.js` | Alternative Node.js version |
| `run-migration.sh` | Bash script |
| `apply-ppom-direct.sh` | Direct bash method |
| `MIGRATION_OPTIONS.sh` | Instructions script |

---

## 🚀 Start Here

### For Terminal Users
```bash
# Fastest way:
node apply-ppom-simple.js
```

### For npm Users
```bash
npm run migrate:ppom
```

### For Supabase CLI Users
```bash
supabase db push < add-ppom-columns.sql
```

---

**Choose your preferred method and run! The migration will complete in seconds. 🚀**
