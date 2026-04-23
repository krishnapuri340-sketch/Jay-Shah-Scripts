import { Router, type IRouter, type Request, type Response } from "express";
import webpush from "web-push";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

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

// ── Subscriptions ──────────────────────────────────────────────────────────────
type PushSub = webpush.PushSubscription & { userId?: string };
let subscriptions: PushSub[] = existsSync(SUBS_FILE)
  ? (() => { try { return JSON.parse(readFileSync(SUBS_FILE, "utf8")); } catch { return []; } })()
  : [];

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
        await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (err: any) {
        // 410 Gone / 404 = subscription expired, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          dead.push(sub.endpoint);
        }
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

router.post("/ipl/push/subscribe", (req: Request, res: Response) => {
  const sub = req.body as PushSub;
  if (!sub?.endpoint) { res.status(400).json({ error: "invalid subscription" }); return; }
  const exists = subscriptions.some(s => s.endpoint === sub.endpoint);
  if (!exists) {
    subscriptions.push(sub);
    saveSubs();
    console.log(`[push] New subscription — total: ${subscriptions.length}`);
  }
  res.json({ ok: true, count: subscriptions.length });
});

router.delete("/ipl/push/unsubscribe", (req: Request, res: Response) => {
  const { endpoint } = req.body || {};
  if (!endpoint) { res.status(400).json({ error: "missing endpoint" }); return; }
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  saveSubs();
  res.json({ ok: true, count: subscriptions.length });
});

router.get("/ipl/push/status", (_req: Request, res: Response) => {
  res.json({ enabled: notifEnabled, subscriberCount: subscriptions.length });
});

router.post("/ipl/push/toggle", (req: Request, res: Response) => {
  const ownerId = req.headers["x-owner-id"] as string;
  if (ownerId !== "rajveer") { res.status(403).json({ error: "commissioner only" }); return; }
  notifEnabled = typeof req.body.enabled === "boolean" ? req.body.enabled : !notifEnabled;
  savePrefs();
  console.log(`[push] Notifications ${notifEnabled ? "enabled" : "disabled"} by commissioner`);
  res.json({ enabled: notifEnabled });
});

router.post("/ipl/push/test", async (req: Request, res: Response) => {
  const ownerId = req.headers["x-owner-id"] as string;
  if (ownerId !== "rajveer") { res.status(403).json({ error: "commissioner only" }); return; }
  await sendPushToAll({
    title: "🏏 Test Notification",
    body: "Push notifications are working for IPL Fantasy 2026!",
    tag: "ipl-test",
    url: "/",
  });
  res.json({ ok: true, sent: subscriptions.length });
});

export default router;
