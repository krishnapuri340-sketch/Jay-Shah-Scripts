import { Router, type IRouter, type Request, type Response } from "express";
import webpush from "web-push";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { requireCommissioner, requireSession, isCommissioner } from "../lib/sessions";

const router: IRouter = Router();

const _bundleDir = fileURLToPath(new URL(".", import.meta.url));
const DATA_DIR = join(_bundleDir, "../ipl-data");
const VAPID_FILE = join(DATA_DIR, "vapid.json");
const SUBS_FILE  = join(DATA_DIR, "push-subscriptions.json");
const PREFS_FILE = join(DATA_DIR, "push-prefs.json");

try { mkdirSync(DATA_DIR, { recursive: true }); } catch {}

// ── VAPID keys (generated once, stored on disk) ───────────────────────────────
let vapidKeys: { publicKey: string; privateKey: string };
if (existsSync(VAPID_FILE)) {
  vapidKeys = JSON.parse(readFileSync(VAPID_FILE, "utf8"));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys));
  console.log("[push] Generated new VAPID keys");
}
webpush.setVapidDetails("mailto:admin@ipl-fantasy.app", vapidKeys.publicKey, vapidKeys.privateKey);

// ── Endpoint allowlist — only known browser push service providers ─────────────
// An attacker who registers an arbitrary endpoint turns the server into a blind
// request proxy (SSRF). We restrict to the domains actually used by Chrome
// (Google FCM), Firefox (Mozilla), Edge (Windows), and Safari (Apple).
const ALLOWED_PUSH_HOSTS = new Set([
  "fcm.googleapis.com",          // Chrome / Chrome-based browsers (primary)
  "fcm.google.com",              // Chrome FCM alternate
  "updates.push.services.mozilla.com", // Firefox push service
  "push.services.mozilla.com",   // Firefox push alternate
  "web.push.apple.com",          // Safari / WebKit push
]);

function isAllowedEndpoint(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  try {
    const u = new URL(raw);
    // Must be HTTPS — browser push is always encrypted
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (ALLOWED_PUSH_HOSTS.has(host)) return true;
    // Edge / Windows: *.notify.windows.com
    if (host.endsWith(".notify.windows.com")) return true;
    return false;
  } catch {
    return false;
  }
}

// ── Key-format validation ──────────────────────────────────────────────────────
// p256dh: 65-byte uncompressed EC P-256 public key → 87 base64url chars (no pad)
// auth:   16-byte random value → 22 base64url chars (no pad)
const B64URL_RE = /^[A-Za-z0-9\-_]+=*$/;
function isValidKeys(keys: unknown): keys is { p256dh: string; auth: string } {
  if (!keys || typeof keys !== "object") return false;
  const k = keys as Record<string, unknown>;
  if (typeof k["p256dh"] !== "string" || typeof k["auth"] !== "string") return false;
  const p256dh = k["p256dh"].replace(/=/g, "");
  const auth   = k["auth"].replace(/=/g, "");
  // p256dh should be 86-88 chars; auth should be 21-24 chars (allow slight padding variance)
  return (
    B64URL_RE.test(k["p256dh"] as string) &&
    p256dh.length >= 86 && p256dh.length <= 88 &&
    B64URL_RE.test(k["auth"] as string) &&
    auth.length >= 20 && auth.length <= 24
  );
}

function isValidSubscription(sub: unknown): sub is webpush.PushSubscription {
  if (!sub || typeof sub !== "object") return false;
  const s = sub as Record<string, unknown>;
  return isAllowedEndpoint(s["endpoint"]) && isValidKeys(s["keys"]);
}

// ── Subscriptions ──────────────────────────────────────────────────────────────
type PushSub = webpush.PushSubscription & { userId?: string };
let subscriptions: PushSub[] = existsSync(SUBS_FILE)
  ? (() => { try { return JSON.parse(readFileSync(SUBS_FILE, "utf8")); } catch { return []; } })()
  : [];

// Scrub any stored subscriptions that don't pass the allowlist/key validation.
// This cleans up any SSRF-vector entries that may have been registered before
// this fix was deployed.
{
  const before = subscriptions.length;
  subscriptions = subscriptions.filter(isValidSubscription);
  const removed = before - subscriptions.length;
  if (removed > 0) {
    console.warn(`[push] Scrubbed ${removed} invalid/disallowed subscription(s) from disk`);
    writeFileSync(SUBS_FILE, JSON.stringify(subscriptions, null, 2));
  }
}

function saveSubs() {
  writeFileSync(SUBS_FILE, JSON.stringify(subscriptions, null, 2));
}

// ── Global enabled toggle (commissioner-controlled) ────────────────────────────
let notifEnabled: boolean = existsSync(PREFS_FILE)
  ? (() => { try { return JSON.parse(readFileSync(PREFS_FILE, "utf8")).enabled ?? true; } catch { return true; } })()
  : true;

function savePrefs() {
  writeFileSync(PREFS_FILE, JSON.stringify({ enabled: notifEnabled }));
}

// ── Per-call timeout wrapper ───────────────────────────────────────────────────
// Prevents a slow or black-hole endpoint from blocking the notification fanout.
const PUSH_TIMEOUT_MS = 10_000;

async function sendWithTimeout(sub: PushSub, payload: string): Promise<void> {
  return Promise.race([
    webpush.sendNotification(sub, payload),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("push timeout")), PUSH_TIMEOUT_MS)
    ),
  ]);
}

// ── Core send function ─────────────────────────────────────────────────────────
export async function sendPushToAll(payload: {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}): Promise<void> {
  if (!notifEnabled || subscriptions.length === 0) return;
  const dead: string[] = [];
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await sendWithTimeout(sub, JSON.stringify(payload));
      } catch (err: any) {
        // 410 Gone / 404 = subscription expired, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          dead.push(sub.endpoint);
        }
        // Timeout and other errors: leave subscription in place, log quietly
      }
    })
  );
  if (dead.length > 0) {
    subscriptions = subscriptions.filter(s => !dead.includes(s.endpoint));
    saveSubs();
    console.log(`[push] Removed ${dead.length} expired subscription(s)`);
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────────

router.get("/ipl/push/vapid-public", (_req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST /api/ipl/push/subscribe — store a push subscription.
// Requires an authenticated session (any league member) to prevent unauthenticated
// SSRF: an attacker registering a crafted endpoint would cause the server to make
// outbound HTTPS requests to an arbitrary host on every future notification.
// The endpoint must also be from a known browser push-service provider.
router.post("/ipl/push/subscribe", (req: Request, res: Response) => {
  const userId = requireSession(req, res);
  if (!userId) return;

  const sub = req.body as PushSub;
  if (!isValidSubscription(sub)) {
    res.status(400).json({ error: "invalid subscription: endpoint must be from a known push provider and keys must be valid base64url" });
    return;
  }

  const exists = subscriptions.some(s => s.endpoint === sub.endpoint);
  if (!exists) {
    // Attach the session-derived userId, not a caller-supplied one
    subscriptions.push({ endpoint: sub.endpoint, keys: sub.keys, userId });
    saveSubs();
    console.log(`[push] New subscription for ${userId} — total: ${subscriptions.length}`);
  }
  res.json({ ok: true, count: subscriptions.length });
});

// DELETE /api/ipl/push/unsubscribe — remove a push subscription.
// Requires an authenticated session so users can only manage their own subscriptions.
router.delete("/ipl/push/unsubscribe", (req: Request, res: Response) => {
  const userId = requireSession(req, res);
  if (!userId) return;

  const { endpoint } = req.body || {};
  if (!endpoint) { res.status(400).json({ error: "missing endpoint" }); return; }

  // Only remove subscriptions belonging to the authenticated user (or commissioner)
  const before = subscriptions.length;
  subscriptions = subscriptions.filter(s =>
    s.endpoint !== endpoint || (s.userId !== userId && !isCommissioner(userId))
  );
  if (subscriptions.length < before) saveSubs();
  res.json({ ok: true, count: subscriptions.length });
});

router.get("/ipl/push/status", (_req: Request, res: Response) => {
  res.json({ enabled: notifEnabled, subscriberCount: subscriptions.length });
});

router.post("/ipl/push/toggle", (req: Request, res: Response) => {
  if (!requireCommissioner(req, res)) return;
  notifEnabled = typeof req.body.enabled === "boolean" ? req.body.enabled : !notifEnabled;
  savePrefs();
  console.log(`[push] Notifications ${notifEnabled ? "enabled" : "disabled"} by commissioner`);
  res.json({ enabled: notifEnabled });
});

router.post("/ipl/push/test", async (req: Request, res: Response) => {
  if (!requireCommissioner(req, res)) return;
  await sendPushToAll({
    title: "🏏 Test Notification",
    body: "Push notifications are working for IPL Fantasy 2026!",
    tag: "ipl-test",
    url: "/",
  });
  res.json({ ok: true, sent: subscriptions.length });
});

export default router;
