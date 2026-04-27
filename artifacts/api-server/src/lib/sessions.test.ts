import { describe, it, expect, beforeEach } from "vitest";
import {
  createSession,
  getSession,
  deleteSession,
  getSessionUser,
  requireSession,
  isCommissioner,
  requireCommissioner,
} from "./sessions";

function makeReq(token?: string, via: "header" | "query" = "header") {
  if (!token) return { headers: {}, query: {} };
  if (via === "header") {
    return { headers: { authorization: `Bearer ${token}` }, query: {} };
  }
  return { headers: {}, query: { token } };
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (body: any) => { res._body = body; return res; };
  return res;
}

describe("createSession", () => {
  it("returns a 64-character hex token", () => {
    const token = createSession("rajveer");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a different token every time", () => {
    const a = createSession("rajveer");
    const b = createSession("rajveer");
    expect(a).not.toBe(b);
  });
});

describe("getSession", () => {
  it("returns the session for a valid token", () => {
    const token = createSession("mombasa");
    const session = getSession(token);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe("mombasa");
  });

  it("returns null for an unknown token", () => {
    expect(getSession("totally-fake-token")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(getSession("")).toBeNull();
  });
});

describe("deleteSession", () => {
  it("removes the session so it can no longer be retrieved", () => {
    const token = createSession("mumbai");
    deleteSession(token);
    expect(getSession(token)).toBeNull();
  });

  it("does not throw when deleting a non-existent token", () => {
    expect(() => deleteSession("ghost-token")).not.toThrow();
  });
});

describe("getSessionUser", () => {
  it("reads the user from a Bearer Authorization header", () => {
    const token = createSession("ponygoat");
    const req = makeReq(token, "header");
    expect(getSessionUser(req)).toBe("ponygoat");
  });

  it("reads the user from a query-string token", () => {
    const token = createSession("ponygoat");
    const req = makeReq(token, "query");
    expect(getSessionUser(req)).toBe("ponygoat");
  });

  it("returns null when no token is provided", () => {
    expect(getSessionUser(makeReq())).toBeNull();
  });

  it("returns null for a malformed Authorization header", () => {
    const req = { headers: { authorization: "NotBearer abc" }, query: {} };
    expect(getSessionUser(req)).toBeNull();
  });

  it("returns null for a Bearer header with an invalid token", () => {
    const req = { headers: { authorization: "Bearer bad-token" }, query: {} };
    expect(getSessionUser(req)).toBeNull();
  });

  it("prefers the Authorization header over query token", () => {
    const headerToken = createSession("rajveer");
    const queryToken = createSession("mombasa");
    const req = {
      headers: { authorization: `Bearer ${headerToken}` },
      query: { token: queryToken },
    };
    expect(getSessionUser(req)).toBe("rajveer");
  });
});

describe("requireSession", () => {
  it("returns the userId for an authenticated request", () => {
    const token = createSession("mumbai");
    const req = makeReq(token);
    const res = makeRes();
    expect(requireSession(req, res)).toBe("mumbai");
    expect(res._status).toBeUndefined();
  });

  it("responds 401 and returns null for an unauthenticated request", () => {
    const req = makeReq();
    const res = makeRes();
    expect(requireSession(req, res)).toBeNull();
    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: "Authentication required" });
  });
});

describe("isCommissioner", () => {
  it("returns true only for rajveer", () => {
    expect(isCommissioner("rajveer")).toBe(true);
  });

  it("returns false for regular members", () => {
    expect(isCommissioner("mombasa")).toBe(false);
    expect(isCommissioner("mumbai")).toBe(false);
    expect(isCommissioner("ponygoat")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isCommissioner(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isCommissioner("")).toBe(false);
  });

  it("is case-sensitive — RAJVEER is not the commissioner", () => {
    expect(isCommissioner("RAJVEER")).toBe(false);
    expect(isCommissioner("Rajveer")).toBe(false);
  });
});

describe("requireCommissioner", () => {
  it("returns true for a valid commissioner session", () => {
    const token = createSession("rajveer");
    const req = makeReq(token);
    const res = makeRes();
    expect(requireCommissioner(req, res)).toBe(true);
    expect(res._status).toBeUndefined();
  });

  it("responds 403 and returns false for a regular member", () => {
    const token = createSession("mombasa");
    const req = makeReq(token);
    const res = makeRes();
    expect(requireCommissioner(req, res)).toBe(false);
    expect(res._status).toBe(403);
    expect(res._body).toEqual({ error: "Forbidden" });
  });

  it("responds 403 for an unauthenticated request", () => {
    const req = makeReq();
    const res = makeRes();
    expect(requireCommissioner(req, res)).toBe(false);
    expect(res._status).toBe(403);
  });

  it("cannot be spoofed by passing rajveer in a fake header", () => {
    const req = {
      headers: { authorization: "Bearer fake", "x-owner-id": "rajveer" },
      query: {},
    };
    const res = makeRes();
    expect(requireCommissioner(req, res)).toBe(false);
    expect(res._status).toBe(403);
  });
});
