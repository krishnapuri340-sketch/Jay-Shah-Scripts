const TOKEN_KEY = "ipl-session-token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function authStreamUrl(baseUrl: string): string {
  const token = getAuthToken();
  if (!token) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}token=${encodeURIComponent(token)}`;
}

export function dispatchSessionExpired(): void {
  window.dispatchEvent(new CustomEvent("ipl:session-expired"));
}

export async function fetchAuthed(url: string, opts: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } });
  if (res.status === 401) dispatchSessionExpired();
  return res;
}
