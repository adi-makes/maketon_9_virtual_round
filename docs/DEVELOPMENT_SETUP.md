# SubscriptIQ — Developer Setup Guide

This guide provides step-by-step instructions for getting a new development environment configured for **SubscriptIQ**.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **Git**: Version `2.40+`
2. **Node.js**: Version `18.18+` or `20.x` LTS (Recommended: Node 20 LTS)
3. **npm**: Version `9.x+` or `10.x` (Use `npm` exclusively; do not use `pnpm`, `yarn`, or `bun`)
4. Access to the shared **Supabase Project**

---

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository
```bash
git clone <REPOSITORY_URL>
cd subscriptiq
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create your local environment configuration:
```bash
# On Linux/macOS
cp .env.example .env.local

# On Windows PowerShell
Copy-Item .env.example .env.local
```

Open `.env.local` and add the Supabase credentials provided by Member 4:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key
```

### Step 4: Validate Your Environment
Run the automated environment validation script:
```bash
npm run check:env
npm run check:env-files
```
Ensure both checks pass with green checkmarks.

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the SubscriptIQ landing page.

---

## 🔑 Demo Credentials (Password: `Password@123`)
- **Admin**: `admin@subscriptiq.com`
- **Staff**: `staff@subscriptiq.com`
- **Customer**: `customer@acme.com`
