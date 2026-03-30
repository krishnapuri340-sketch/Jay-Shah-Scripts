import { Router } from "express";
import webpush from "web-push";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_CONTACT = process.env.VAPID_CONTACT || "mailto:admin@iplfantasy.app";

const SUBS_FILE = join(process.cwd(), "push-subscriptions.json");

function loadSubs(): any[] {
  try {
    if (!existsSync(SUBS_FILE)) return [];
    return JSON.parse(readFileSync(SUBS_FILE, "utf8"));
  } catch { return []; }
}

function saveSubs(subs: any[]) {
  try { writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2)); } catch (_) {}
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

router.get("/api/push/vapid-public-key", (_req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY });
});

router.post("/api/push/subscribe", (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint) { res.status(400).json({ error: "Invalid subscription" }); return; }
  const subs = loadSubs();
  if (!subs.some((s: any) => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    saveSubs(subs);
  }
  res.json({ ok: true, count: subs.length });
});

router.post("/api/push/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) saveSubs(loadSubs().filter((s: any) => s.endpoint !== endpoint));
  res.json({ ok: true });
});

router.post("/api/push/broadcast", async (req, res) => {
  const { title, body, tag, url } = req.body || {};
  const sent = await sendPushToAll({ title: title || "IPL Fantasy 2026", body: body || "", tag, url });
  res.json({ ok: true, sent });
});

router.get("/api/push/subscriber-count", (_req, res) => {
  res.json({ count: loadSubs().length });
});

export async function sendPushToAll(payload: { title: string; body: string; tag?: string; url?: string }) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;
  const subs = loadSubs();
  if (subs.length === 0) return 0;
  const dead: string[] = [];
  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent++;
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) dead.push(sub.endpoint);
      }
    })
  );
  if (dead.length > 0) saveSubs(subs.filter((s: any) => !dead.includes(s.endpoint)));
  return sent;
}

export default router;
