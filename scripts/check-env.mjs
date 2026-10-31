import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envLocalPath = path.join(rootDir, ".env.local");

console.info("\n🔍 Validating SubscriptIQ Environment Configuration...\n");

// 1. Check whether root .env.local exists
if (!fs.existsSync(envLocalPath)) {
  console.error("❌ Error: Missing root .env.local file.");
  console.error(
    "👉 Please create it by running:\n   cp .env.example .env.local\n"
  );
  console.error(
    "Then fill in your Supabase project credentials from the Supabase Dashboard.\n"
  );
  process.exit(1);
}

// Read and parse .env.local manually (no external dependency needed)
const rawContent = fs.readFileSync(envLocalPath, "utf-8");
const parsedEnv = {};

for (const line of rawContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const equalsIdx = trimmed.indexOf("=");
  if (equalsIdx !== -1) {
    const key = trimmed.slice(0, equalsIdx).trim();
    let val = trimmed.slice(equalsIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    parsedEnv[key] = val;
  }
}

let hasErrors = false;

// 2. Check NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = parsedEnv["NEXT_PUBLIC_SUPABASE_URL"];
if (!supabaseUrl || supabaseUrl.trim() === "") {
  console.error(
    "❌ Error: NEXT_PUBLIC_SUPABASE_URL is missing or empty in .env.local."
  );
  hasErrors = true;
} else {
  try {
    const parsedUrl = new URL(supabaseUrl);
    if (!parsedUrl.protocol.startsWith("http")) {
      console.error(
        "❌ Error: NEXT_PUBLIC_SUPABASE_URL must use http:// or https:// protocol."
      );
      hasErrors = true;
    } else {
      console.info("✅ NEXT_PUBLIC_SUPABASE_URL is syntactically valid.");
    }
  } catch {
    console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
    hasErrors = true;
  }
}

// 3. Check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseKey = parsedEnv["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
if (!supabaseKey || supabaseKey.trim() === "") {
  console.error(
    "❌ Error: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or empty in .env.local."
  );
  hasErrors = true;
} else {
  console.info("✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is present.");
}

// 4. Summarize and exit
if (hasErrors) {
  console.error(
    "\n❌ Environment validation failed. Please correct the issues in .env.local.\n"
  );
  console.error(
    "Where to find these values:\n  Supabase Dashboard -> Project Settings -> API -> Project URL & anon/public key.\n"
  );
  process.exit(1);
} else {
  console.info("\n🎉 Environment validation passed successfully!\n");
  process.exit(0);
}
