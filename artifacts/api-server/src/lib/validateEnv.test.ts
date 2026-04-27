interface EnvRule {
  key: string;
  description: string;
  denylist?: string[];
}

const REQUIRED_VARS: EnvRule[] = [
  {
    key: "PORT",
    description: "HTTP port the server listens on",
  },
  {
    key: "REPLIT_DB_URL",
    description: "Replit KV URL — used to persist sessions across restarts",
    denylist: ["your-replit-db-url", "https://example.com"],
  },
  {
    key: "DATABASE_URL",
    description: "PostgreSQL connection string (Supabase) — used for PINs and predictions",
    denylist: ["postgresql://user:pass@host/db", "your-database-url"],
  },
  {
    key: "VAPID_PUBLIC_KEY",
    description: "VAPID public key — required for web push notifications",
    denylist: ["your-vapid-public-key"],
  },
  {
    key: "VAPID_PRIVATE_KEY",
    description: "VAPID private key — required for web push notifications",
    denylist: ["your-vapid-private-key"],
  },
];

export function validateEnv(): void {
  const errors: string[] = [];

  for (const rule of REQUIRED_VARS) {
    const value = process.env[rule.key];

    if (!value || value.trim() === "") {
      errors.push(`  ✗ ${rule.key} is not set — ${rule.description}`);
      continue;
    }

    if (rule.denylist?.includes(value.trim())) {
      errors.push(
        `  ✗ ${rule.key} looks like a placeholder ("${value}") — ${rule.description}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `\n\n[startup] Missing or invalid environment variables:\n${errors.join("\n")}\n\n` +
        `Set these in Replit Secrets (not in source files) and restart.\n`,
    );
  }

  console.log("[startup] Environment variables validated ✓");
}
