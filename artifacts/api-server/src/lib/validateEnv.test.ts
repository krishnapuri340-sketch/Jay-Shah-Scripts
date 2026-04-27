import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnv } from "./validateEnv";

const REQUIRED_KEYS = [
  "PORT",
  "REPLIT_DB_URL",
  "DATABASE_URL",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

function setValidEnv() {
  process.env.PORT = "3000";
  process.env.REPLIT_DB_URL = "https://kv.replit.com/real";
  process.env.DATABASE_URL = "postgresql://user:pass@db.supabase.co/prod";
  process.env.VAPID_PUBLIC_KEY = "BReal_Public_Key_Here";
  process.env.VAPID_PRIVATE_KEY = "RealPrivateKeyHere";
}

function clearEnv() {
  for (const key of REQUIRED_KEYS) delete process.env[key];
}

beforeEach(() => {
  clearEnv();
  setValidEnv();
});

afterEach(() => {
  clearEnv();
});

describe("validateEnv — valid config", () => {
  it("does not throw when all required vars are set", () => {
    expect(() => validateEnv()).not.toThrow();
  });
});

describe("validateEnv — missing variables", () => {
  it("throws when PORT is missing", () => {
    delete process.env.PORT;
    expect(() => validateEnv()).toThrow("PORT");
  });

  it("throws when REPLIT_DB_URL is missing", () => {
    delete process.env.REPLIT_DB_URL;
    expect(() => validateEnv()).toThrow("REPLIT_DB_URL");
  });

  it("throws when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow("DATABASE_URL");
  });

  it("throws when VAPID_PUBLIC_KEY is missing", () => {
    delete process.env.VAPID_PUBLIC_KEY;
    expect(() => validateEnv()).toThrow("VAPID_PUBLIC_KEY");
  });

  it("throws when VAPID_PRIVATE_KEY is missing", () => {
    delete process.env.VAPID_PRIVATE_KEY;
    expect(() => validateEnv()).toThrow("VAPID_PRIVATE_KEY");
  });

  it("lists ALL missing vars in a single error", () => {
    clearEnv();
    let message = "";
    try { validateEnv(); } catch (e: any) { message = e.message; }
    for (const key of REQUIRED_KEYS) {
      expect(message).toContain(key);
    }
  });
});

describe("validateEnv — placeholder values", () => {
  it("throws when REPLIT_DB_URL is the placeholder value", () => {
    process.env.REPLIT_DB_URL = "your-replit-db-url";
    expect(() => validateEnv()).toThrow("REPLIT_DB_URL");
  });

  it("throws when DATABASE_URL is the placeholder value", () => {
    process.env.DATABASE_URL = "your-database-url";
    expect(() => validateEnv()).toThrow("DATABASE_URL");
  });

  it("throws when VAPID_PUBLIC_KEY is the placeholder value", () => {
    process.env.VAPID_PUBLIC_KEY = "your-vapid-public-key";
    expect(() => validateEnv()).toThrow("VAPID_PUBLIC_KEY");
  });

  it("throws when VAPID_PRIVATE_KEY is the placeholder value", () => {
    process.env.VAPID_PRIVATE_KEY = "your-vapid-private-key";
    expect(() => validateEnv()).toThrow("VAPID_PRIVATE_KEY");
  });

  it("throws when a var is set to an empty string", () => {
    process.env.PORT = "";
    expect(() => validateEnv()).toThrow("PORT");
  });

  it("throws when a var is set to only whitespace", () => {
    process.env.PORT = "   ";
    expect(() => validateEnv()).toThrow("PORT");
  });
});
