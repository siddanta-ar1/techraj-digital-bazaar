# 🎯 PPOM Migration - Terminal Execution (QUICK REFERENCE)

## YES! You Can Run It Directly from Terminal! ✅

---

## 🚀 Fastest Way (1 Command)

```bash
npm run migrate:ppom
```

That's it! The migration will:
1. ✅ Read your `.env.local` credentials
2. ✅ Load the migration SQL
3. ✅ Execute on Supabase
4. ✅ Show results

---

## Alternative Methods

### Method 1: Node.js (Direct)
```bash
node apply-ppom-simple.js
```

### Method 2: Bash Script
```bash
chmod +x run-migration.sh
./run-migration.sh
```

### Method 3: Direct Bash
```bash
chmod +x apply-ppom-direct.sh
./apply-ppom-direct.sh
```

---

## 📊 What Happens

```
Your Terminal Command
        ↓
apply-ppom-simple.js
        ↓
Read .env.local (Supabase credentials)
        ↓
Read add-ppom-columns.sql (migration)
        ↓
Connect to Supabase API
        ↓
Execute migration
        ↓
✅ PPOM columns added to database
```

---

## ✅ That's All!

After running the command:

1. ✅ PPOM data will be stored
2. ✅ Admin will show PPOM options
3. ✅ Ready for next phase

---

## 📁 Files Created for Terminal Execution

| File | Command | Purpose |
|------|---------|---------|
| `apply-ppom-simple.js` | `node apply-ppom-simple.js` | Node.js executor (NO deps) |
| `run-migration.sh` | `./run-migration.sh` | Bash with jq |
| `apply-ppom-direct.sh` | `./apply-ppom-direct.sh` | Direct bash script |
| `package.json` | `npm run migrate:ppom` | NPM script |

---

## 🎉 Try It Now!

```bash
# Pick one:

# 1. Simplest
npm run migrate:ppom

# 2. Node.js direct
node apply-ppom-simple.js

# 3. Bash
./run-migration.sh
```

**All three will work! The first one is the easiest.**

---

## ✨ No Supabase Dashboard Needed Anymore!

Before: Manual copy-paste in web dashboard  
Now: ✅ Terminal one-liner!

---

## 📖 Full Guide

See `PPOM_TERMINAL_GUIDE.md` for:
- Detailed explanation of each method
- Troubleshooting
- Verification steps
- Alternative tools (supabase CLI, psql)

---

**Ready? Run this now:**

```bash
npm run migrate:ppom
```

**That's it! 🚀**
